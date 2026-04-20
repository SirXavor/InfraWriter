import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import AppShell from "../components/layout/AppShell";
import { useHost } from "../hooks/useHost";
import { useDistros, useProfilesByDistro, useRoles } from "../hooks/useCatalog";
import {
  useCreateHost,
  useUpdateHost,
  useDeleteHost,
} from "../hooks/useHostMutations";
import { useEditorStore } from "../stores/editorStore";
import type { Host, AppConfig } from "../features/hosts/host.types";

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

type Tab = "general" | "provisioning" | "automation" | "usuarios" | "apps";

interface UserRow {
  name: string;
  password: string;
  groups: string;
  shell: string;
  ssh_keys: string;
}

interface AppRow {
  kind: string;
  enabled: boolean;
  values: Record<string, string>;
}

interface ScalarFields {
  hostname: string;
  distro: string;
  version: string;
  profile: string;
  server: string;
  luks_passphrase: string;
  tang_url: string;
  // hidden — preserved from existing host or defaults
  repo_url: string;
  repo_branch: string;
  repo_local_path: string;
  playbook: string;
  interval: string;
}

// ---------------------------------------------------------------------------
// Apps catalog
// ---------------------------------------------------------------------------

interface FieldDef {
  name: string;
  label: string;
  type: "text" | "number" | "password";
  placeholder?: string;
}

const KIND_FIELDS: Record<string, FieldDef[]> = {
  wireguard: [
    { name: "url", label: "URL / dominio", type: "text", placeholder: "wg.example.com" },
    { name: "port", label: "Puerto UDP", type: "number", placeholder: "51820" },
    { name: "password", label: "Contraseña admin", type: "password" },
  ],
};

const KNOWN_KINDS = Object.keys(KIND_FIELDS);

// Roles that enable the Apps tab
const K8S_ROLES = ["k3s-edge", "k3s", "k8s", "kubernetes"];
// Roles that are always selected and cannot be removed
const REQUIRED_ROLES = ["automation"];

// ---------------------------------------------------------------------------
// Conversion helpers
// ---------------------------------------------------------------------------

function hostToScalars(host: Host): ScalarFields {
  return {
    hostname: host.hostname,
    distro: host.provisioning?.distro ?? "",
    version: host.provisioning?.version ?? "",
    profile: host.profile,
    server: (host.provisioning as any)?.server ?? "",
    luks_passphrase: (host.provisioning as any)?.luks_passphrase ?? "",
    tang_url: (host.provisioning as any)?.tang_url ?? "",
    repo_url: host.automation.repo.url,
    repo_branch: host.automation.repo.branch,
    repo_local_path: host.automation.repo.local_path,
    playbook: host.automation.apply.playbook,
    interval: host.automation.apply.interval,
  };
}

function hostToApps(host: Host): Record<string, AppRow> {
  if (!host.apps) return {};
  return Object.fromEntries(
    Object.entries(host.apps).map(([key, app]) => [
      key,
      {
        kind: app.kind,
        enabled: app.enabled,
        values: Object.fromEntries(
          Object.entries(app.values).map(([k, v]) => [k, String(v)])
        ),
      },
    ])
  );
}

function parseAppValues(
  kind: string,
  values: Record<string, string>
): Record<string, unknown> {
  const fields = KIND_FIELDS[kind] ?? [];
  return Object.fromEntries(
    Object.entries(values).map(([k, v]) => {
      const field = fields.find((f) => f.name === k);
      return [k, field?.type === "number" ? (v === "" ? undefined : Number(v)) : v];
    })
  );
}

function buildHost(
  s: ScalarFields,
  macs: string[],
  roles: string[],
  users: UserRow[],
  apps: Record<string, AppRow>
): Host {
  const cleanMacs = macs.map((m) => m.trim()).filter(Boolean);
  const appsOut: Record<string, AppConfig> = {};
  for (const [key, row] of Object.entries(apps)) {
    appsOut[key] = {
      kind: row.kind,
      enabled: row.enabled,
      values: parseAppValues(row.kind, row.values),
    };
  }
  return {
    kind: "host",
    name: s.hostname,
    hostname: s.hostname,
    profile: s.profile,
    identity: cleanMacs.length > 0 ? { mac: cleanMacs } : undefined,
    provisioning: s.distro
      ? ({
          distro: s.distro as any,
          version: s.version,
          ...(s.server && { server: s.server }),
          ...(s.luks_passphrase && { luks_passphrase: s.luks_passphrase }),
          ...(s.tang_url && { tang_url: s.tang_url }),
        } as any)
      : undefined,
    automation: {
      repo: {
        url: s.repo_url,
        branch: s.repo_branch,
        local_path: s.repo_local_path,
      },
      apply: {
        playbook: s.playbook,
        interval: s.interval,
      },
      roles,
      vars: {
        users: users
          .filter((u) => u.name.trim())
          .map((u) => ({
            name: u.name.trim(),
            ...(u.password && { password: u.password }),
            groups: u.groups.split(",").map((g) => g.trim()).filter(Boolean),
            shell: u.shell || "/bin/bash",
            ssh_keys: u.ssh_keys.split("\n").map((k) => k.trim()).filter(Boolean),
          })),
      },
    },
    ...(Object.keys(appsOut).length > 0 && { apps: appsOut }),
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "provisioning", label: "Provisioning" },
  { id: "automation", label: "Automatización" },
  { id: "usuarios", label: "Usuarios" },
  { id: "apps", label: "Aplicaciones" },
];

const DEFAULT_SCALARS: ScalarFields = {
  hostname: "",
  distro: "",
  version: "",
  profile: "",
  server: "",
  luks_passphrase: "",
  tang_url: "",
  repo_url: "https://github.com/SirXavor/InfraServer.git",
  repo_branch: "main",
  repo_local_path: "/opt/InfraServer",
  playbook: "playbooks/bootstrap.yaml",
  interval: "1h",
};

export default function HostEditPage() {
  const { hostId } = useParams<{ hostId: string }>();
  const navigate = useNavigate();
  const isNew = hostId === "new";
  const draftKey = hostId ?? "new";

  const [tab, setTab] = useState<Tab>("general");
  const [macs, setMacs] = useState<string[]>([""]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(REQUIRED_ROLES);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [apps, setApps] = useState<Record<string, AppRow>>({});
  const [expandedApp, setExpandedApp] = useState<string | null>(null);
  const [newAppKey, setNewAppKey] = useState("");
  const [newAppKind, setNewAppKind] = useState(KNOWN_KINDS[0] ?? "");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const setDraft = useEditorStore((s) => s.setDraft);
  const getDraft = useEditorStore((s) => s.getDraft);
  const clearDraft = useEditorStore((s) => s.clearDraft);
  const hasDraft = useEditorStore((s) => s.hasDraft);

  const { data: existingHost, isLoading: loadingHost } = useHost(
    isNew ? undefined : hostId
  );
  const { data: distros } = useDistros();
  const { data: allRoles } = useRoles();

  const form = useForm<ScalarFields>({ defaultValues: DEFAULT_SCALARS });
  const { register, handleSubmit, reset, control, formState: { isSubmitting } } = form;

  const watchedDistro = useWatch({ control, name: "distro" });
  const { data: profiles } = useProfilesByDistro(watchedDistro || undefined);

  const createMut = useCreateHost();
  const updateMut = useUpdateHost(hostId ?? "");
  const deleteMut = useDeleteHost();

  const appsEnabled = selectedRoles.some((r) => K8S_ROLES.includes(r));
  const appCount = Object.keys(apps).length;
  const isDirty = hasDraft(draftKey);

  // Restore draft or existing host (runs once when data is ready)
  useEffect(() => {
    if (initialized) return;
    if (!isNew && loadingHost) return;

    const source = getDraft(draftKey) ?? existingHost;
    if (source) {
      reset(hostToScalars(source));
      setMacs(source.identity?.mac?.length ? source.identity.mac : [""]);
      setSelectedRoles(
        source.automation.roles?.length ? source.automation.roles : REQUIRED_ROLES
      );
      setUsers(
        (source.automation.vars?.users ?? []).map((u) => ({
          name: u.name,
          password: u.password ?? "",
          groups: (u.groups ?? []).join(", "),
          shell: u.shell ?? "/bin/bash",
          ssh_keys: (u.ssh_keys ?? []).join("\n"),
        }))
      );
      setApps(hostToApps(source));
    }
    setInitialized(true);
  }, [existingHost, loadingHost, initialized, isNew, getDraft, draftKey, reset]);

  // Save draft on any change after initialization
  useEffect(() => {
    if (!initialized) return;
    const { unsubscribe } = form.watch((values) => {
      const h = buildHost(
        values as ScalarFields,
        macs,
        selectedRoles,
        users,
        apps
      );
      setDraft(draftKey, h);
    });
    return unsubscribe;
  }, [form, macs, selectedRoles, users, apps, draftKey, setDraft, initialized]);

  const onSubmit = handleSubmit(async (scalars) => {
    setSaveError(null);
    const host = buildHost(scalars, macs, selectedRoles, users, apps);
    try {
      if (isNew) {
        await createMut.mutateAsync(host);
      } else {
        await updateMut.mutateAsync(host);
      }
      clearDraft(draftKey);
      navigate("/");
    } catch (e: any) {
      setSaveError(e?.response?.data?.detail ?? "Error al guardar. Revisa los datos.");
    }
  });

  const onDelete = async () => {
    if (!hostId || isNew) return;
    if (!confirm(`¿Eliminar el host "${existingHost?.hostname ?? hostId}"?`)) return;
    try {
      await deleteMut.mutateAsync(hostId);
      clearDraft(draftKey);
      navigate("/");
    } catch (e: any) {
      setSaveError(e?.response?.data?.detail ?? "Error al eliminar.");
    }
  };

  const toggleRole = (role: string) => {
    if (REQUIRED_ROLES.includes(role)) return;
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const updateMac = (i: number, val: string) =>
    setMacs((prev) => prev.map((m, j) => (j === i ? val : m)));
  const removeMac = (i: number) =>
    setMacs((prev) => prev.filter((_, j) => j !== i));

  const updateUser = (i: number, patch: Partial<UserRow>) =>
    setUsers((prev) => prev.map((u, j) => (j === i ? { ...u, ...patch } : u)));
  const removeUser = (i: number) =>
    setUsers((prev) => prev.filter((_, j) => j !== i));

  const toggleAppEnabled = (key: string) =>
    setApps((prev) => ({
      ...prev,
      [key]: { ...prev[key], enabled: !prev[key].enabled },
    }));
  const updateAppValue = (key: string, field: string, value: string) =>
    setApps((prev) => ({
      ...prev,
      [key]: { ...prev[key], values: { ...prev[key].values, [field]: value } },
    }));
  const removeApp = (key: string) =>
    setApps((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  const addApp = () => {
    const key = newAppKey.trim();
    if (!key || apps[key]) return;
    const fields = KIND_FIELDS[newAppKind] ?? [];
    setApps((prev) => ({
      ...prev,
      [key]: {
        kind: newAppKind,
        enabled: true,
        values: Object.fromEntries(fields.map((f) => [f.name, ""])),
      },
    }));
    setExpandedApp(key);
    setNewAppKey("");
  };

  if (!isNew && loadingHost) {
    return (
      <AppShell>
        <p className="state-msg">Cargando host...</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">
          {isNew ? "Nuevo host" : (existingHost?.hostname ?? hostId)}
          {isDirty && <span className="draft-badge">sin guardar</span>}
        </h1>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => navigate("/")}
        >
          ← Volver
        </button>
      </div>

      <form onSubmit={onSubmit}>
        {/* Hidden fields — git/playbook config preserved but not shown */}
        <input type="hidden" {...register("repo_url")} />
        <input type="hidden" {...register("repo_branch")} />
        <input type="hidden" {...register("repo_local_path")} />
        <input type="hidden" {...register("playbook")} />
        <input type="hidden" {...register("interval")} />

        <div className="form-tabs">
          {TABS.map((t) => {
            if (t.id === "apps" && !appsEnabled) return null;
            return (
              <button
                key={t.id}
                type="button"
                className={`form-tab${tab === t.id ? " active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                {t.id === "apps" && appCount > 0 && (
                  <span className="tab-badge">{appCount}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ---- GENERAL ---- */}
        {tab === "general" && (
          <div className="form-section">
            <div className="form-field">
              <label className="form-label">Hostname</label>
              <input
                {...register("hostname", { required: true })}
                className="form-input"
                placeholder="k3s-edge-01"
                disabled={!isNew}
              />
              {!isNew && (
                <span className="field-hint">
                  El hostname no se puede cambiar en un host existente.
                </span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">Sistema operativo</label>
              <select
                {...register("distro")}
                className="form-select"
                disabled={!isNew}
              >
                <option value="">— Seleccionar —</option>
                {(distros ?? []).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {!isNew && (
                <span className="field-hint">
                  No se puede cambiar el SO de un host existente.
                </span>
              )}
            </div>

            <div className="form-field">
              <label className="form-label">Direcciones MAC</label>
              {macs.map((mac, i) => (
                <div key={i} className="array-item">
                  <input
                    className="form-input"
                    value={mac}
                    onChange={(e) => updateMac(i, e.target.value)}
                    placeholder="aa-bb-cc-dd-ee-ff"
                  />
                  {macs.length > 1 && (
                    <button
                      type="button"
                      className="btn-icon"
                      onClick={() => removeMac(i)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className="btn-add"
                onClick={() => setMacs((prev) => [...prev, ""])}
              >
                + Añadir MAC
              </button>
            </div>
          </div>
        )}

        {/* ---- PROVISIONING ---- */}
        {tab === "provisioning" && (
          <div className="form-section">
            {!isNew && (
              <p className="field-hint field-hint--warn">
                El provisioning no se puede modificar en un host ya creado.
              </p>
            )}

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Perfil de almacenamiento</label>
                <select
                  {...register("profile", { required: true })}
                  className="form-select"
                  disabled={!isNew}
                >
                  <option value="">— Seleccionar —</option>
                  {!watchedDistro && isNew && (
                    <option value="" disabled>
                      Selecciona un SO primero
                    </option>
                  )}
                  {(profiles ?? []).map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-field">
                <label className="form-label">Versión</label>
                <input
                  {...register("version")}
                  className="form-input"
                  placeholder="24.04"
                  disabled={!isNew}
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Servidor de provisioning</label>
              <input
                {...register("server")}
                className="form-input"
                placeholder="192.168.1.70:8081"
                disabled={!isNew}
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">LUKS passphrase</label>
                <input
                  {...register("luks_passphrase")}
                  className="form-input"
                  type="password"
                  autoComplete="new-password"
                  disabled={!isNew}
                />
              </div>
              <div className="form-field">
                <label className="form-label">Tang URL</label>
                <input
                  {...register("tang_url")}
                  className="form-input"
                  placeholder="http://192.168.1.70:8082"
                  disabled={!isNew}
                />
              </div>
            </div>
          </div>
        )}

        {/* ---- AUTOMATION ---- */}
        {tab === "automation" && (
          <div className="form-section">
            <p className="form-section-title">Roles de Ansible</p>
            {allRoles ? (
              <div className="roles-grid">
                {allRoles.map((role) => {
                  const isRequired = REQUIRED_ROLES.includes(role);
                  return (
                    <label
                      key={role}
                      className={`role-item${isRequired ? " role-item--required" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role)}
                        onChange={() => toggleRole(role)}
                        disabled={isRequired}
                      />
                      <div>
                        <div className="role-name">{role}</div>
                        {isRequired && (
                          <div className="role-desc">Requerido</div>
                        )}
                        {K8S_ROLES.includes(role) && (
                          <div className="role-desc">Habilita pestaña de apps</div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <p className="field-hint">Cargando roles del catálogo...</p>
            )}
          </div>
        )}

        {/* ---- USUARIOS ---- */}
        {tab === "usuarios" && (
          <div className="form-section">
            {users.map((user, i) => (
              <div key={i} className="user-card">
                <div className="user-card-header">
                  <span className="user-card-title">
                    {user.name || `Usuario ${i + 1}`}
                  </span>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => removeUser(i)}
                  >
                    Eliminar
                  </button>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Nombre de usuario</label>
                    <input
                      className="form-input"
                      value={user.name}
                      onChange={(e) => updateUser(i, { name: e.target.value })}
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Shell</label>
                    <input
                      className="form-input"
                      value={user.shell}
                      onChange={(e) => updateUser(i, { shell: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Password (hash SHA-512)</label>
                    <input
                      className="form-input"
                      value={user.password}
                      onChange={(e) => updateUser(i, { password: e.target.value })}
                      placeholder="$6$salt$hash..."
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Grupos</label>
                    <input
                      className="form-input"
                      value={user.groups}
                      onChange={(e) => updateUser(i, { groups: e.target.value })}
                      placeholder="sudo, docker"
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">SSH Keys (una por línea)</label>
                  <textarea
                    className="form-textarea"
                    value={user.ssh_keys}
                    rows={4}
                    onChange={(e) => updateUser(i, { ssh_keys: e.target.value })}
                    placeholder="ssh-ed25519 AAAA... Comentario"
                  />
                </div>
              </div>
            ))}
            <button
              type="button"
              className="btn-add"
              onClick={() =>
                setUsers((prev) => [
                  ...prev,
                  { name: "", password: "", groups: "", shell: "/bin/bash", ssh_keys: "" },
                ])
              }
            >
              + Añadir usuario
            </button>
          </div>
        )}

        {/* ---- APPS ---- */}
        {tab === "apps" && appsEnabled && (
          <div className="form-section">
            {Object.entries(apps).map(([key, app]) => {
              const fields = KIND_FIELDS[app.kind] ?? [];
              const isExpanded = expandedApp === key;
              return (
                <div
                  key={key}
                  className={`app-card${app.enabled ? "" : " app-card--disabled"}`}
                >
                  <div className="app-card-header">
                    <div className="app-card-info">
                      <span className="app-card-key">{key}</span>
                      <span className="app-card-kind">{app.kind}</span>
                    </div>
                    <div className="app-card-actions">
                      <label className="app-toggle">
                        <input
                          type="checkbox"
                          checked={app.enabled}
                          onChange={() => toggleAppEnabled(key)}
                        />
                        <span>{app.enabled ? "Activa" : "Inactiva"}</span>
                      </label>
                      <button
                        type="button"
                        className="btn-icon"
                        onClick={() => setExpandedApp(isExpanded ? null : key)}
                      >
                        {isExpanded ? "▲" : "▼"}
                      </button>
                      <button
                        type="button"
                        className="btn-icon btn-icon--danger"
                        onClick={() => removeApp(key)}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="app-card-body">
                      {fields.length > 0 ? (
                        fields.map((field) => (
                          <div key={field.name} className="form-field">
                            <label className="form-label">{field.label}</label>
                            <input
                              className="form-input"
                              type={field.type}
                              placeholder={field.placeholder}
                              value={app.values[field.name] ?? ""}
                              onChange={(e) =>
                                updateAppValue(key, field.name, e.target.value)
                              }
                              autoComplete={
                                field.type === "password" ? "new-password" : undefined
                              }
                            />
                          </div>
                        ))
                      ) : (
                        <p className="field-hint">
                          Sin campos definidos para "{app.kind}".
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <div className="add-app-form">
              <p className="form-section-title">Añadir aplicación</p>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Identificador (clave única)</label>
                  <input
                    className="form-input"
                    value={newAppKey}
                    onChange={(e) => setNewAppKey(e.target.value)}
                    placeholder="wg-home"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label">Tipo</label>
                  <select
                    className="form-select"
                    value={newAppKind}
                    onChange={(e) => setNewAppKind(e.target.value)}
                  >
                    {KNOWN_KINDS.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                className="btn-add"
                onClick={addApp}
                disabled={!newAppKey.trim() || !!apps[newAppKey.trim()]}
              >
                + Añadir aplicación
              </button>
              {apps[newAppKey.trim()] && (
                <span className="field-hint field-hint--error">
                  Ya existe una app con ese identificador.
                </span>
              )}
            </div>
          </div>
        )}

        {saveError && <p className="save-error">{saveError}</p>}

        <div className="form-footer">
          {!isNew && (
            <button
              type="button"
              className="btn btn-danger"
              onClick={onDelete}
              disabled={deleteMut.isPending}
            >
              {deleteMut.isPending ? "Eliminando..." : "Eliminar host"}
            </button>
          )}
          <div className="spacer" />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Guardando..."
              : isNew
              ? "Crear host"
              : "Guardar cambios"}
          </button>
        </div>
      </form>
    </AppShell>
  );
}

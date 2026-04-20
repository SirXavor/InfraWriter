import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import AppShell from "../components/layout/AppShell";
import { useHost } from "../hooks/useHost";
import { useDistros, useRoles } from "../hooks/useCatalog";
import {
  useCreateHost,
  useUpdateHost,
  useDeleteHost,
} from "../hooks/useHostMutations";
import type { Host } from "../features/hosts/host.types";

// ---------------------------------------------------------------------------
// Local form types
// ---------------------------------------------------------------------------

type Tab = "general" | "provisioning" | "automation" | "usuarios";

interface UserRow {
  name: string;
  password: string;
  groups: string;   // comma-separated
  shell: string;
  ssh_keys: string; // newline-separated
}

interface ScalarFields {
  name: string;
  hostname: string;
  profile: string;
  distro: string;
  version: string;
  server: string;
  luks_passphrase: string;
  tang_url: string;
  ubuntu_iso: string;
  repo_url: string;
  repo_branch: string;
  repo_local_path: string;
  playbook: string;
  interval: string;
}

// ---------------------------------------------------------------------------
// Conversion helpers
// ---------------------------------------------------------------------------

function hostToScalars(host: Host): ScalarFields {
  return {
    name: host.name,
    hostname: host.hostname,
    profile: host.profile,
    distro: host.provisioning?.distro ?? "",
    version: host.provisioning?.version ?? "",
    server: (host.provisioning as any)?.server ?? "",
    luks_passphrase: (host.provisioning as any)?.luks_passphrase ?? "",
    tang_url: (host.provisioning as any)?.tang_url ?? "",
    ubuntu_iso: (host.provisioning as any)?.ubuntu_iso ?? "",
    repo_url: host.automation.repo.url,
    repo_branch: host.automation.repo.branch,
    repo_local_path: host.automation.repo.local_path,
    playbook: host.automation.apply.playbook,
    interval: host.automation.apply.interval,
  };
}

function buildHost(
  s: ScalarFields,
  macs: string[],
  roles: string[],
  users: UserRow[]
): Host {
  const cleanMacs = macs.map((m) => m.trim()).filter(Boolean);
  return {
    kind: "host",
    name: s.name,
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
          ...(s.ubuntu_iso && { ubuntu_iso: s.ubuntu_iso }),
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
            groups: u.groups
              .split(",")
              .map((g) => g.trim())
              .filter(Boolean),
            shell: u.shell || "/bin/bash",
            ssh_keys: u.ssh_keys
              .split("\n")
              .map((k) => k.trim())
              .filter(Boolean),
          })),
      },
    },
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DISTROS = ["ubuntu", "rhel", "rocky", "almalinux", "centos"];

const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "General" },
  { id: "provisioning", label: "Provisioning" },
  { id: "automation", label: "Automatización" },
  { id: "usuarios", label: "Usuarios" },
];

export default function HostEditPage() {
  const { hostId } = useParams<{ hostId: string }>();
  const navigate = useNavigate();
  const isNew = hostId === "new";

  const [tab, setTab] = useState<Tab>("general");
  const [macs, setMacs] = useState<string[]>([""]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: existingHost, isLoading: loadingHost } = useHost(
    isNew ? undefined : hostId
  );
  const { data: distros } = useDistros();
  const { data: allRoles } = useRoles();

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<ScalarFields>({
    defaultValues: {
      repo_branch: "main",
      repo_local_path: "/opt/InfraServer",
      playbook: "playbooks/bootstrap.yaml",
      interval: "1h",
    },
  });

  const createMut = useCreateHost();
  const updateMut = useUpdateHost(hostId ?? "");
  const deleteMut = useDeleteHost();

  useEffect(() => {
    if (existingHost) {
      reset(hostToScalars(existingHost));
      setMacs(
        existingHost.identity?.mac?.length
          ? existingHost.identity.mac
          : [""]
      );
      setSelectedRoles(existingHost.automation.roles ?? []);
      setUsers(
        (existingHost.automation.vars?.users ?? []).map((u) => ({
          name: u.name,
          password: u.password ?? "",
          groups: (u.groups ?? []).join(", "),
          shell: u.shell ?? "/bin/bash",
          ssh_keys: (u.ssh_keys ?? []).join("\n"),
        }))
      );
    }
  }, [existingHost, reset]);

  const onSubmit = handleSubmit(async (scalars) => {
    setSaveError(null);
    const host = buildHost(scalars, macs, selectedRoles, users);
    try {
      if (isNew) {
        await createMut.mutateAsync(host);
      } else {
        await updateMut.mutateAsync(host);
      }
      navigate("/");
    } catch (e: any) {
      setSaveError(
        e?.response?.data?.detail ?? "Error al guardar. Revisa los datos."
      );
    }
  });

  const onDelete = async () => {
    if (!hostId || isNew) return;
    if (!confirm(`¿Eliminar el host "${existingHost?.name ?? hostId}"?`)) return;
    try {
      await deleteMut.mutateAsync(hostId);
      navigate("/");
    } catch (e: any) {
      setSaveError(e?.response?.data?.detail ?? "Error al eliminar.");
    }
  };

  const toggleRole = (role: string) => {
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
          {isNew ? "Nuevo host" : (existingHost?.name ?? hostId)}
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
        <div className="form-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`form-tab${tab === t.id ? " active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ---- GENERAL ---- */}
        {tab === "general" && (
          <div className="form-section">
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Nombre</label>
                <input
                  {...register("name", { required: true })}
                  className="form-input"
                  placeholder="edge-node-01"
                />
              </div>
              <div className="form-field">
                <label className="form-label">Hostname</label>
                <input
                  {...register("hostname", { required: true })}
                  className="form-input"
                  placeholder="k3s-edge-01"
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Perfil de almacenamiento</label>
              <input
                {...register("profile", { required: true })}
                className="form-input"
                placeholder="noswap"
              />
              <span className="field-hint">
                ej: noswap · edge-tang-storage · default-storage
              </span>
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
            <div className="form-row">
              <div className="form-field">
                <label className="form-label">Distro</label>
                <select {...register("distro")} className="form-select">
                  <option value="">— Seleccionar —</option>
                  {(distros ?? DISTROS).map((d) => (
                    <option key={d} value={d}>
                      {d}
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
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Servidor de provisioning</label>
              <input
                {...register("server")}
                className="form-input"
                placeholder="192.168.1.70:8081"
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
                />
              </div>
              <div className="form-field">
                <label className="form-label">Tang URL</label>
                <input
                  {...register("tang_url")}
                  className="form-input"
                  placeholder="http://192.168.1.70:8082"
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">Ubuntu ISO</label>
              <input
                {...register("ubuntu_iso")}
                className="form-input"
                placeholder="ubuntu-24.04.4-live-server-amd64.iso"
              />
            </div>
          </div>
        )}

        {/* ---- AUTOMATION ---- */}
        {tab === "automation" && (
          <>
            <div className="form-section">
              <p className="form-section-title">Repositorio Git</p>
              <div className="form-field">
                <label className="form-label">URL</label>
                <input
                  {...register("repo_url", { required: true })}
                  className="form-input"
                  placeholder="https://github.com/usuario/InfraServer.git"
                />
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Rama</label>
                  <input {...register("repo_branch")} className="form-input" />
                </div>
                <div className="form-field">
                  <label className="form-label">Ruta local</label>
                  <input
                    {...register("repo_local_path")}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">Playbook</label>
                  <input {...register("playbook")} className="form-input" />
                </div>
                <div className="form-field">
                  <label className="form-label">Intervalo de sync</label>
                  <input
                    {...register("interval")}
                    className="form-input"
                    placeholder="1h"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <p className="form-section-title">Roles de Ansible</p>
              {allRoles ? (
                <div className="roles-grid">
                  {allRoles.map((role) => (
                    <label key={role.name} className="role-item">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(role.name)}
                        onChange={() => toggleRole(role.name)}
                      />
                      <div>
                        <div className="role-name">
                          {role.display_name || role.name}
                        </div>
                        {role.description && (
                          <div className="role-desc">{role.description}</div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="field-hint">Cargando roles del catálogo...</p>
              )}
            </div>
          </>
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
                      onChange={(e) =>
                        updateUser(i, { shell: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-field">
                    <label className="form-label">Password (hash SHA-512)</label>
                    <input
                      className="form-input"
                      value={user.password}
                      onChange={(e) =>
                        updateUser(i, { password: e.target.value })
                      }
                      placeholder="$6$salt$hash..."
                    />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Grupos</label>
                    <input
                      className="form-input"
                      value={user.groups}
                      onChange={(e) =>
                        updateUser(i, { groups: e.target.value })
                      }
                      placeholder="sudo, docker"
                    />
                  </div>
                </div>
                <div className="form-field">
                  <label className="form-label">
                    SSH Keys (una por línea)
                  </label>
                  <textarea
                    className="form-textarea"
                    value={user.ssh_keys}
                    rows={4}
                    onChange={(e) =>
                      updateUser(i, { ssh_keys: e.target.value })
                    }
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
                  {
                    name: "",
                    password: "",
                    groups: "",
                    shell: "/bin/bash",
                    ssh_keys: "",
                  },
                ])
              }
            >
              + Añadir usuario
            </button>
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

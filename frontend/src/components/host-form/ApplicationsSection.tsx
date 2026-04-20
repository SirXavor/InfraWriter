import { useState } from "react";
import type { UseFormWatch, UseFormSetValue } from "react-hook-form";
import type { Host, AppConfig } from "../../features/hosts/host.types";

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

interface Props {
  watch: UseFormWatch<Host>;
  setValue: UseFormSetValue<Host>;
}

export default function ApplicationsSection({ watch, setValue }: Props) {
  const apps = watch("apps") ?? {};
  const [expanded, setExpanded] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newKind, setNewKind] = useState(KNOWN_KINDS[0] ?? "wireguard");

  function setApps(next: Record<string, AppConfig>) {
    setValue("apps", next, { shouldDirty: true });
  }

  function toggleEnabled(key: string) {
    setApps({ ...apps, [key]: { ...apps[key], enabled: !apps[key].enabled } });
  }

  function updateValue(key: string, field: string, raw: string) {
    const fieldDef = (KIND_FIELDS[apps[key].kind] ?? []).find((f) => f.name === field);
    const typed: unknown = fieldDef?.type === "number" ? (raw === "" ? "" : Number(raw)) : raw;
    setApps({
      ...apps,
      [key]: { ...apps[key], values: { ...apps[key].values, [field]: typed } },
    });
  }

  function removeApp(key: string) {
    const next = { ...apps };
    delete next[key];
    setApps(next);
    if (expanded === key) setExpanded(null);
  }

  function addApp() {
    const key = newKey.trim();
    if (!key || apps[key]) return;
    const fields = KIND_FIELDS[newKind] ?? [];
    setApps({
      ...apps,
      [key]: {
        kind: newKind,
        enabled: true,
        values: Object.fromEntries(fields.map((f) => [f.name, ""])),
      },
    });
    setExpanded(key);
    setNewKey("");
  }

  return (
    <section className="editor-section">
      <h3 className="editor-section-title">Aplicaciones</h3>

      {Object.entries(apps).map(([key, app]) => {
        const fields = KIND_FIELDS[app.kind] ?? [];
        const isOpen = expanded === key;
        return (
          <div key={key} className={`app-card${app.enabled ? "" : " app-card--disabled"}`}>
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
                    onChange={() => toggleEnabled(key)}
                  />
                  <span>{app.enabled ? "Activa" : "Inactiva"}</span>
                </label>
                <button
                  type="button"
                  className="app-btn-icon"
                  onClick={() => setExpanded(isOpen ? null : key)}
                >
                  {isOpen ? "▲" : "▼"}
                </button>
                <button
                  type="button"
                  className="app-btn-icon app-btn-icon--danger"
                  onClick={() => removeApp(key)}
                >
                  ✕
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="app-card-body">
                {fields.length > 0 ? (
                  <div className="form-grid">
                    {fields.map((f) => (
                      <div key={f.name} className="form-field">
                        <label className="form-label">{f.label}</label>
                        <input
                          className="form-input"
                          type={f.type}
                          placeholder={f.placeholder}
                          value={String(app.values[f.name] ?? "")}
                          onChange={(e) => updateValue(key, f.name, e.target.value)}
                          autoComplete={f.type === "password" ? "new-password" : undefined}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="sidebar-message">Sin campos para "{app.kind}".</p>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="app-add-form">
        <div className="form-grid">
          <div className="form-field">
            <label className="form-label">Identificador</label>
            <input
              className="form-input"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="wg-home"
            />
          </div>
          <div className="form-field">
            <label className="form-label">Tipo</label>
            <select
              className="form-select"
              value={newKind}
              onChange={(e) => setNewKind(e.target.value)}
            >
              {KNOWN_KINDS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="button"
          className="btn-add-app"
          onClick={addApp}
          disabled={!newKey.trim() || !!apps[newKey.trim()]}
        >
          + Añadir aplicación
        </button>
        {apps[newKey.trim()] && (
          <p className="form-error">Ya existe una app con ese identificador.</p>
        )}
      </div>
    </section>
  );
}

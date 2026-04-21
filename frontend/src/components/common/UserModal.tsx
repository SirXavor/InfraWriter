import { useState } from "react";
import type { HostUser } from "../../features/hosts/host.types";

interface Props {
  user: Partial<HostUser>;
  title?: string;
  onSave: (user: HostUser) => void;
  onClose: () => void;
}

export default function UserModal({ user, title, onSave, onClose }: Props) {
  const [form, setForm] = useState({
    name: user.name ?? "",
    password: user.password ?? "",
    groups: (user.groups ?? []).join(", "),
    shell: user.shell ?? "/bin/bash",
    ssh_keys: (user.ssh_keys ?? []).join("\n"),
  });

  const set = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  function handleSave() {
    if (!form.name.trim()) return;
    onSave({
      name: form.name.trim(),
      ...(form.password && { password: form.password }),
      groups: form.groups.split(",").map((g) => g.trim()).filter(Boolean),
      shell: form.shell || "/bin/bash",
      ssh_keys: form.ssh_keys.split("\n").map((k) => k.trim()).filter(Boolean),
    });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{title ?? (user.name ? `Editar ${user.name}` : "Nuevo usuario")}</h3>
          <button type="button" className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Nombre de usuario</label>
              <input
                className="form-input"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="admin"
                autoFocus
              />
            </div>
            <div className="form-field">
              <label className="form-label">Shell</label>
              <input
                className="form-input"
                value={form.shell}
                onChange={(e) => set("shell", e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Password (hash SHA-512)</label>
              <input
                className="form-input"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="$6$salt$hash..."
              />
            </div>
            <div className="form-field">
              <label className="form-label">Grupos</label>
              <input
                className="form-input"
                value={form.groups}
                onChange={(e) => set("groups", e.target.value)}
                placeholder="sudo, docker"
              />
            </div>
          </div>

          <div className="form-field" style={{ marginTop: "1rem" }}>
            <label className="form-label">SSH Keys (una por línea)</label>
            <textarea
              className="form-input modal-textarea"
              rows={4}
              value={form.ssh_keys}
              onChange={(e) => set("ssh_keys", e.target.value)}
              placeholder="ssh-ed25519 AAAA... comentario"
            />
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="modal-btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="modal-btn-save"
            onClick={handleSave}
            disabled={!form.name.trim()}
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}

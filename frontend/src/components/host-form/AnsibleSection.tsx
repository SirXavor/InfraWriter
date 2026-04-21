import { useState } from "react";
import { Controller } from "react-hook-form";
import type { Control, UseFormWatch, UseFormSetValue } from "react-hook-form";
import type { Host, HostUser } from "../../features/hosts/host.types";
import RolesSelector from "./RolesSelector";
import UserModal from "../common/UserModal";

interface AnsibleSectionProps {
  control: Control<Host>;
  watch: UseFormWatch<Host>;
  setValue: UseFormSetValue<Host>;
}

export default function AnsibleSection({ control, watch, setValue }: AnsibleSectionProps) {
  const users = watch("automation.vars.users") ?? [];
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [addingUser, setAddingUser] = useState(false);

  function saveUser(index: number, user: HostUser) {
    const next = [...users];
    next[index] = user;
    setValue("automation.vars.users", next, { shouldDirty: true });
    setEditingIndex(null);
  }

  function addUser(user: HostUser) {
    setValue("automation.vars.users", [...users, user], { shouldDirty: true });
    setAddingUser(false);
  }

  function removeUser(index: number) {
    setValue(
      "automation.vars.users",
      users.filter((_, i) => i !== index),
      { shouldDirty: true }
    );
  }

  return (
    <>
      <section className="editor-section">
        <h3 className="editor-section-title">Roles de Ansible</h3>
        <Controller
          control={control}
          name="automation.roles"
          render={({ field }) => (
            <RolesSelector value={field.value ?? []} onChange={field.onChange} />
          )}
        />
      </section>

      <section className="editor-section">
        <div className="section-row">
          <h3 className="editor-section-title" style={{ margin: 0 }}>Usuarios del sistema</h3>
          <button type="button" className="btn-add-app" onClick={() => setAddingUser(true)}>
            + Añadir usuario
          </button>
        </div>

        {users.length === 0 ? (
          <p className="sidebar-message" style={{ marginTop: "0.75rem" }}>Sin usuarios configurados.</p>
        ) : (
          <div className="user-list">
            {users.map((user, i) => (
              <div key={i} className="user-row">
                <div className="user-row-info">
                  <span className="user-row-name">{user.name}</span>
                  {user.groups?.length ? (
                    <span className="user-row-meta">{user.groups.join(", ")}</span>
                  ) : null}
                </div>
                <div className="user-row-actions">
                  <button type="button" className="app-btn-icon" onClick={() => setEditingIndex(i)}>
                    Editar
                  </button>
                  <button type="button" className="app-btn-icon app-btn-icon--danger" onClick={() => removeUser(i)}>
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {editingIndex !== null && (
        <UserModal
          user={users[editingIndex]}
          onSave={(u) => saveUser(editingIndex, u)}
          onClose={() => setEditingIndex(null)}
        />
      )}

      {addingUser && (
        <UserModal
          user={{}}
          title="Nuevo usuario"
          onSave={addUser}
          onClose={() => setAddingUser(false)}
        />
      )}
    </>
  );
}

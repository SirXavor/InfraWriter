import { useEffect, useState } from "react";
import type {
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
} from "react-hook-form";
import type { Host, HostUser } from "../../features/hosts/host.types";
import FormInput from "../common/FormInput";
import FormSelect from "../common/FormSelect";
import UserModal from "../common/UserModal";
import { useDistros, useProfilesByDistro } from "../../hooks/useCatalog";

interface ProvisioningSectionProps {
  register: UseFormRegister<Host>;
  watch: UseFormWatch<Host>;
  setValue: UseFormSetValue<Host>;
  isNew: boolean;
}

export default function ProvisioningSection({
  register,
  watch,
  setValue,
  isNew,
}: ProvisioningSectionProps) {
  const selectedDistro = watch("provisioning.distro");
  const selectedProfile = watch("profile");
  const users = watch("automation.vars.users") ?? [];
  const primaryUser = users[0];

  const [editingUser, setEditingUser] = useState(false);

  const { data: distros = [], isLoading: distrosLoading } = useDistros();
  const { data: profiles = [], isLoading: profilesLoading } = useProfilesByDistro(selectedDistro);

  useEffect(() => {
    if (!selectedDistro) return;
    const validProfiles = profiles.map((p) => p.name);
    if (selectedProfile && !validProfiles.includes(selectedProfile)) {
      setValue("profile", "");
    }
  }, [selectedDistro, selectedProfile, profiles, setValue]);

  function savePrimaryUser(user: HostUser) {
    const next = [...users];
    next[0] = user;
    setValue("automation.vars.users", next, { shouldDirty: true });
    setEditingUser(false);
  }

  const distroOptions = distros.map((d) => ({ value: d, label: d }));
  const profileOptions = profiles.map((p) => ({ value: p.name, label: p.name }));

  return (
    <>
      <section className="editor-section">
        <h3 className="editor-section-title">Provisioning</h3>

        {!isNew && (
          <p className="section-warning">
            Las opciones de provisioning no se pueden modificar en un host existente.
          </p>
        )}

        <div className="form-grid">
          <FormSelect
            label="Distro"
            {...register("provisioning.distro")}
            options={distroOptions}
            placeholder={distrosLoading ? "Cargando distros..." : "Selecciona distro"}
            disabled={!isNew}
          />

          <FormInput
            label="Versión"
            {...register("provisioning.version")}
            disabled={!isNew}
          />

          <FormSelect
            label="Perfil de almacenamiento"
            {...register("profile")}
            options={profileOptions}
            placeholder={
              !selectedDistro
                ? "Selecciona primero una distro"
                : profilesLoading
                ? "Cargando perfiles..."
                : "Selecciona perfil"
            }
            disabled={!isNew || !selectedDistro || profilesLoading}
          />

          <FormInput
            label="Servidor provisioning"
            {...register("provisioning.server")}
            disabled={!isNew}
          />

          <FormInput
            label="Tang URL"
            {...register("provisioning.tang_url")}
            disabled={!isNew}
          />
        </div>
      </section>

      <section className="editor-section">
        <div className="section-row">
          <h3 className="editor-section-title" style={{ margin: 0 }}>
            Usuario principal
          </h3>
          <button type="button" className="btn-add-app" onClick={() => setEditingUser(true)}>
            {primaryUser ? "Editar" : "Configurar"}
          </button>
        </div>

        {primaryUser ? (
          <div className="user-row" style={{ marginTop: "0.75rem" }}>
            <div className="user-row-info">
              <span className="user-row-name">{primaryUser.name}</span>
              {primaryUser.groups?.length ? (
                <span className="user-row-meta">{primaryUser.groups.join(", ")}</span>
              ) : null}
              {primaryUser.ssh_keys?.length ? (
                <span className="user-row-meta">{primaryUser.ssh_keys.length} SSH key(s)</span>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="sidebar-message" style={{ marginTop: "0.75rem" }}>
            Sin usuario principal configurado.
          </p>
        )}
      </section>

      {editingUser && (
        <UserModal
          user={primaryUser ?? {}}
          title="Usuario principal"
          onSave={savePrimaryUser}
          onClose={() => setEditingUser(false)}
        />
      )}
    </>
  );
}

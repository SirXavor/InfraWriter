import { useEffect } from "react";
import type {
  UseFormRegister,
  UseFormWatch,
  UseFormSetValue,
} from "react-hook-form";
import type { Host } from "../../features/hosts/host.types";
import FormInput from "../common/FormInput";
import FormSelect from "../common/FormSelect";
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

  const { data: distros = [], isLoading: distrosLoading } = useDistros();
  const { data: profiles = [], isLoading: profilesLoading } = useProfilesByDistro(selectedDistro);

  // Clear profile when distro changes and current profile is no longer valid
  useEffect(() => {
    if (!selectedDistro) return;
    const validProfiles = profiles.map((p) => p.name);
    if (selectedProfile && !validProfiles.includes(selectedProfile)) {
      setValue("profile", "");
    }
  }, [selectedDistro, selectedProfile, profiles, setValue]);

  const distroOptions = distros.map((d) => ({ value: d, label: d }));
  const profileOptions = profiles.map((p) => ({ value: p.name, label: p.name }));

  return (
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
  );
}

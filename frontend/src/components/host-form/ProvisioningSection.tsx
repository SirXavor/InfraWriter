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
}

export default function ProvisioningSection({
  register,
  watch,
  setValue,
}: ProvisioningSectionProps) {
  const selectedDistro = watch("provisioning.distro");
  const selectedProfile = watch("profile");

  const {
    data: distros = [],
    isLoading: distrosLoading,
  } = useDistros();

  const {
    data: profiles = [],
    isLoading: profilesLoading,
  } = useProfilesByDistro(selectedDistro);

  useEffect(() => {
    if (!selectedDistro) return;

    const validProfiles = profiles.map((p) => p.name);

    if (selectedProfile && !validProfiles.includes(selectedProfile)) {
      setValue("profile", "");
    }
  }, [selectedDistro, selectedProfile, profiles, setValue]);

  const distroOptions = distros.map((distro) => ({
    value: distro,
    label: distro,
  }));

  const profileOptions = profiles.map((profile) => ({
    value: profile.name,
    label: profile.name,
  }));

  return (
    <section className="editor-section">
      <h3 className="editor-section-title">Provisioning</h3>

      <div className="form-grid">
        <FormSelect
          label="Distro"
          {...register("provisioning.distro")}
          options={distroOptions}
          placeholder={distrosLoading ? "Cargando distros..." : "Selecciona distro"}
        />

        <FormInput
          label="Versión"
          {...register("provisioning.version")}
        />

        <FormSelect
          label="Perfil"
          {...register("profile")}
          options={profileOptions}
          placeholder={
            !selectedDistro
              ? "Selecciona primero una distro"
              : profilesLoading
              ? "Cargando perfiles..."
              : "Selecciona perfil"
          }
          disabled={!selectedDistro || profilesLoading}
        />

        <FormInput
          label="Servidor provisioning"
          {...register("provisioning.server")}
        />

        <FormInput
          label="Tang URL"
          {...register("provisioning.tang_url")}
        />

        <FormInput
          label="Ubuntu ISO"
          {...register("provisioning.ubuntu_iso")}
        />
      </div>
    </section>
  );
}
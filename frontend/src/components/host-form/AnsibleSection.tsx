import { Controller } from "react-hook-form";
import type {
  Control,
  UseFormRegister,
} from "react-hook-form";
import type { Host } from "../../features/hosts/host.types";
import FormInput from "../common/FormInput";
import RolesSelector from "./RolesSelector";

interface AnsibleSectionProps {
  register: UseFormRegister<Host>;
  control: Control<Host>;
}

export default function AnsibleSection({
  register,
  control,
}: AnsibleSectionProps) {
  return (
    <section className="editor-section">
      <h3 className="editor-section-title">Ansible</h3>

      <div className="form-grid">
        <FormInput
          label="Repositorio Git"
          {...register("automation.repo.url")}
        />

        <FormInput
          label="Ruta local"
          {...register("automation.repo.local_path")}
        />

        <FormInput
          label="Rama"
          {...register("automation.repo.branch")}
        />

        <FormInput
          label="Playbook"
          {...register("automation.apply.playbook")}
        />

        <FormInput
          label="Intervalo"
          {...register("automation.apply.interval")}
        />
      </div>

      <div style={{ marginTop: "1rem" }}>
        <h4 className="editor-section-title">Roles</h4>

        <Controller
          control={control}
          name="automation.roles"
          render={({ field }) => (
            <RolesSelector
              value={field.value ?? []}
              onChange={field.onChange}
            />
          )}
        />
      </div>
    </section>
  );
}
import { Controller } from "react-hook-form";
import type { Control, UseFormRegister } from "react-hook-form";
import type { Host } from "../../features/hosts/host.types";
import RolesSelector from "./RolesSelector";

interface AnsibleSectionProps {
  register: UseFormRegister<Host>;
  control: Control<Host>;
}

export default function AnsibleSection({ register: _register, control }: AnsibleSectionProps) {
  return (
    <section className="editor-section">
      <h3 className="editor-section-title">Roles de Ansible</h3>

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
    </section>
  );
}

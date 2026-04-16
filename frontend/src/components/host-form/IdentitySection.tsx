import type { UseFormRegister } from "react-hook-form";
import type { Host } from "../../features/hosts/host.types";
import FormInput from "../common/FormInput";

interface IdentitySectionProps {
  register: UseFormRegister<Host>;
}

export default function IdentitySection({ register }: IdentitySectionProps) {
  return (
    <section className="editor-section">
      <h3 className="editor-section-title">Identidad</h3>

      <div className="form-grid">
        <FormInput label="Nombre" {...register("name")} />
        <FormInput label="Hostname" {...register("hostname")} />
        <FormInput label="Perfil" {...register("profile")} />
      </div>
    </section>
  );
}
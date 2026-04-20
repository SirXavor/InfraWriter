import type { UseFormRegister } from "react-hook-form";
import type { Host } from "../../features/hosts/host.types";
import FormInput from "../common/FormInput";

interface IdentitySectionProps {
  register: UseFormRegister<Host>;
  isNew: boolean;
}

export default function IdentitySection({ register, isNew }: IdentitySectionProps) {
  return (
    <section className="editor-section">
      <h3 className="editor-section-title">Identidad</h3>

      <div className="form-grid">
        {/* name is synced from hostname in HostEditor */}
        <input type="hidden" {...register("name")} />

        <FormInput
          label="Hostname"
          {...register("hostname")}
          disabled={!isNew}
        />

        <FormInput
          label="MAC (principal)"
          {...register("identity.mac.0")}
          placeholder="aa:bb:cc:dd:ee:ff"
        />
      </div>
    </section>
  );
}

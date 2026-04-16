import { useForm, Controller } from "react-hook-form";
import type { Host } from "../../features/hosts/host.types";
import IdentitySection from "../host-form/IdentitySection";
import ProvisioningSection from "../host-form/ProvisioningSection";
import RolesSelector from "../host-form/RolesSelector";
import { useUpdateHost } from "../../hooks/useUpdateHost";
import { useEffect } from "react";
import { useEditorState } from "../../app/EditorStateContext";

interface HostEditorProps {
  host: Host;
}

export default function HostEditor({ host }: HostEditorProps) {
  const form = useForm<Host>({
    defaultValues: host,
  });

  const {
    register,
    watch,
    setValue,
    control,
    handleSubmit,
    formState,
  } = form;

  const values = watch();

  const { mutate, isPending } = useUpdateHost(host.id!);

  const { setIsDirty } = useEditorState();

  function onSubmit(data: Host) {
    mutate(data);
  }

  useEffect(() => {
    setIsDirty(formState.isDirty);
  }, [formState.isDirty, setIsDirty]);
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="host-editor">
      <header className="editor-header">
        <h2 className="editor-title">{host.name}</h2>
        <div className="editor-subtitle">{host.hostname}</div>
      </header>

      <div className="editor-actions">
        <button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar"}
        </button>

        {formState.isDirty && (
          <span className="editor-dirty">Cambios sin guardar</span>
        )}
      </div>

      <IdentitySection register={register} />

      <ProvisioningSection
        register={register}
        watch={watch}
        setValue={setValue}
      />

      <section className="editor-section">
        <h3 className="editor-section-title">Roles</h3>

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

      <section className="editor-section">
        <h3 className="editor-section-title">Preview JSON</h3>
        <pre className="editor-preview">
          {JSON.stringify(values, null, 2)}
        </pre>
      </section>
    </form>
  );
}
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { Host } from "../../features/hosts/host.types";
import IdentitySection from "../host-form/IdentitySection";
import ProvisioningSection from "../host-form/ProvisioningSection";
import AnsibleSection from "../host-form/AnsibleSection";
import ApplicationsSection from "../host-form/ApplicationsSection";
import YamlPreviewSection from "../preview/YamlPreviewSection";
import EditorTabs from "../common/EditorTabs";
import { useUpdateHost } from "../../hooks/useUpdateHost";
import { useEditorStore } from "../../stores/editorStore";

interface HostEditorProps {
  host: Host;
}

const tabs = [
  { key: "identity", label: "Identidad" },
  { key: "provisioning", label: "Provisioning" },
  { key: "ansible", label: "Ansible" },
  { key: "applications", label: "Aplicaciones" },
  { key: "yaml", label: "YAML" },
];

export default function HostEditor({ host }: HostEditorProps) {
  const [activeTab, setActiveTab] = useState("identity");

  const setDraft = useEditorStore((s) => s.setDraft);
  const getDraft = useEditorStore((s) => s.getDraft);
  const clearDraft = useEditorStore((s) => s.clearDraft);

  const draft = host.id ? getDraft(host.id) : undefined;

  const form = useForm<Host>({
    defaultValues: draft ?? host,
  });

  const {
    register,
    watch,
    setValue,
    control,
    handleSubmit,
    formState,
    reset,
  } = form;

  const values = watch();
  const { mutate, isPending } = useUpdateHost(host.id!);

  useEffect(() => {
    reset(draft ?? host);
  }, [draft, host, reset]);

  useEffect(() => {
    if (!host.id) return;

    if (formState.isDirty) {
      setDraft(host.id, values);
    } else {
      clearDraft(host.id);
    }
  }, [values, host.id, formState.isDirty, setDraft, clearDraft]);

  function onSubmit(data: Host) {
    mutate(data, {
      onSuccess: () => {
        clearDraft(host.id!);
        reset(data);
      },
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="host-editor">
      <header className="editor-header">
        <h2 className="editor-title">{values.name}</h2>
        <div className="editor-subtitle">{values.hostname}</div>
      </header>

      <div className="editor-actions">
        <button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : "Guardar"}
        </button>

        {formState.isDirty && (
          <span className="editor-dirty">Cambios sin guardar</span>
        )}
      </div>

      <EditorTabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "identity" && <IdentitySection register={register} />}

      {activeTab === "provisioning" && (
        <ProvisioningSection
          register={register}
          watch={watch}
          setValue={setValue}
        />
      )}

      {activeTab === "ansible" && (
        <AnsibleSection
          register={register}
          control={control}
        />
      )}

      {activeTab === "applications" && <ApplicationsSection />}

      {activeTab === "yaml" && <YamlPreviewSection data={values} />}
    </form>
  );
}
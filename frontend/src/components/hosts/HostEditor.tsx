import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import type { Host } from "../../features/hosts/host.types";
import IdentitySection from "../host-form/IdentitySection";
import ProvisioningSection from "../host-form/ProvisioningSection";
import AnsibleSection from "../host-form/AnsibleSection";
import ApplicationsSection from "../host-form/ApplicationsSection";
import YamlPreviewSection from "../preview/YamlPreviewSection";
import EditorTabs from "../common/EditorTabs";
import { useUpdateHost } from "../../hooks/useUpdateHost";
import { useCreateHost, useDeleteHost } from "../../hooks/useHostMutations";
import { useEditorStore } from "../../stores/editorStore";

interface HostEditorProps {
  host: Host;
  isNew?: boolean;
}

const K8S_ROLES = ["k3s-edge", "k3s", "k8s", "kubernetes"];

export default function HostEditor({ host, isNew = false }: HostEditorProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("identity");

  const setDraft = useEditorStore((s) => s.setDraft);
  const getDraft = useEditorStore((s) => s.getDraft);
  const clearDraft = useEditorStore((s) => s.clearDraft);

  const draftKey = isNew ? "__new__" : (host.id ?? host.hostname);
  const draft = getDraft(draftKey);

  const form = useForm<Host>({
    defaultValues: draft ?? host,
  });

  const { register, watch, setValue, control, handleSubmit, formState, reset } = form;

  const values = watch();
  const hasK8sRole = (values.automation?.roles ?? []).some((r) => K8S_ROLES.includes(r));

  const tabs = [
    { key: "identity", label: "Identidad" },
    { key: "provisioning", label: "Provisioning" },
    { key: "ansible", label: "Ansible" },
    ...(hasK8sRole ? [{ key: "applications", label: "Aplicaciones" }] : []),
    { key: "yaml", label: "YAML" },
  ];

  const { mutate: update, isPending: isUpdating } = useUpdateHost(host.id ?? "");
  const { mutate: create, isPending: isCreating } = useCreateHost();
  const { mutate: remove, isPending: isDeleting } = useDeleteHost();
  const isPending = isUpdating || isCreating || isDeleting;

  // Sync name from hostname (single identifier field)
  const hostname = watch("hostname");
  useEffect(() => {
    setValue("name", hostname);
  }, [hostname, setValue]);

  // Restore draft or host data when host prop changes
  useEffect(() => {
    reset(getDraft(draftKey) ?? host);
  }, [host.id]);

  // Save draft on every change
  useEffect(() => {
    if (!formState.isDirty) return;
    setDraft(draftKey, values);
  }, [values, formState.isDirty, draftKey, setDraft]);

  // Switch away from apps tab if k8s role removed
  useEffect(() => {
    if (!hasK8sRole && activeTab === "applications") {
      setActiveTab("ansible");
    }
  }, [hasK8sRole, activeTab]);

  function onSubmit(data: Host) {
    if (isNew) {
      create(data, {
        onSuccess: (created) => {
          clearDraft(draftKey);
          navigate(`/hosts/${created.id ?? created.hostname}`);
        },
      });
    } else {
      update(data, {
        onSuccess: () => {
          clearDraft(draftKey);
          reset(data);
        },
      });
    }
  }

  function onDelete() {
    if (!host.id) return;
    if (!confirm(`¿Eliminar el host "${host.hostname}"?`)) return;
    remove(host.id, {
      onSuccess: () => {
        clearDraft(draftKey);
        navigate("/");
      },
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="host-editor">
      <header className="editor-header">
        <h2 className="editor-title">
          {isNew ? "Nuevo host" : (values.hostname || "—")}
        </h2>
        {!isNew && values.hostname !== values.name && (
          <div className="editor-subtitle">{values.name}</div>
        )}
      </header>

      <div className="editor-actions">
        <button type="submit" disabled={isPending}>
          {isPending ? "Guardando..." : isNew ? "Crear host" : "Guardar"}
        </button>

        {!isNew && (
          <button
            type="button"
            className="btn-delete"
            onClick={onDelete}
            disabled={isPending}
          >
            {isDeleting ? "Eliminando..." : "Eliminar"}
          </button>
        )}

        {formState.isDirty && (
          <span className="editor-dirty">Cambios sin guardar</span>
        )}
      </div>

      <EditorTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === "identity" && (
        <IdentitySection register={register} isNew={isNew} />
      )}

      {activeTab === "provisioning" && (
        <ProvisioningSection
          register={register}
          watch={watch}
          setValue={setValue}
          isNew={isNew}
        />
      )}

      {activeTab === "ansible" && (
        <AnsibleSection register={register} control={control} />
      )}

      {activeTab === "applications" && hasK8sRole && (
        <ApplicationsSection watch={watch} setValue={setValue} />
      )}

      {activeTab === "yaml" && <YamlPreviewSection data={values} />}
    </form>
  );
}

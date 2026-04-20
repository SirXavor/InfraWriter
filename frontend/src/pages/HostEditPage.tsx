import { useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { useHost } from "../hooks/useHost";
import HostEditor from "../components/hosts/HostEditor";
import type { Host } from "../features/hosts/host.types";

const BLANK_HOST: Host = {
  kind: "host",
  name: "",
  hostname: "",
  profile: "",
  provisioning: {
    distro: "",
    version: "",
  },
  automation: {
    repo: {
      url: "https://github.com/SirXavor/InfraServer.git",
      branch: "main",
      local_path: "/opt/InfraServer",
    },
    apply: {
      playbook: "playbooks/bootstrap.yaml",
      interval: "1h",
    },
    roles: ["automation"],
    vars: {},
  },
};

export default function HostEditPage() {
  const { hostId } = useParams();
  const isNew = hostId === "new";

  const { data: host, isLoading, isError } = useHost(isNew ? undefined : hostId);

  if (!isNew && isLoading) return <AppShell><p className="sidebar-message">Cargando host...</p></AppShell>;
  if (!isNew && isError)   return <AppShell><p className="sidebar-message error">Error cargando host</p></AppShell>;
  if (!isNew && !host)     return <AppShell><p className="sidebar-message">Host no encontrado</p></AppShell>;

  return (
    <AppShell>
      <HostEditor host={host ?? BLANK_HOST} isNew={isNew} />
    </AppShell>
  );
}

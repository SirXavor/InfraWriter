import { useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { useHost } from "../hooks/useHost";
import HostEditor from "../components/hosts/HostEditor";

export default function HostEditPage() {
  const { hostId } = useParams();
  const { data: host, isLoading, isError } = useHost(hostId);

  return (
    <AppShell>
      {isLoading && <p>Cargando host...</p>}

      {isError && <p>Error cargando host</p>}

      {host && <HostEditor host={host} />}
    </AppShell>
  );
}
import { useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { useHost } from "../hooks/useHost";

export default function HostEditPage() {
  const { hostId } = useParams();
  const { data: host, isLoading, isError } = useHost(hostId);

  return (
    <AppShell>
      {isLoading && <p>Cargando host...</p>}

      {isError && <p>Error cargando host</p>}

      {host && (
        <>
          <h1>{host.name}</h1>

          <pre>
            {JSON.stringify(host, null, 2)}
          </pre>
        </>
      )}
    </AppShell>
  );
}
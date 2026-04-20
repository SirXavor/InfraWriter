import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { useHosts } from "../hooks/useHosts";

export default function HostsPage() {
  const { data: hosts, isLoading, isError } = useHosts();
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className="page-header">
        <h1 className="page-title">Hosts</h1>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/hosts/new")}
        >
          + Nuevo host
        </button>
      </div>

      {isLoading && <p className="state-msg">Cargando...</p>}
      {isError && (
        <p className="state-msg error">Error al cargar los hosts</p>
      )}

      {hosts && (
        <div className="hosts-table-wrap">
          <table className="hosts-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Hostname</th>
                <th>Distro</th>
                <th>Perfil</th>
                <th>MAC principal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {hosts.map((host) => (
                <tr
                  key={host.id ?? host.name}
                  className="host-row"
                  onClick={() =>
                    navigate(`/hosts/${host.id ?? host.name}`)
                  }
                >
                  <td className="cell-name">{host.name}</td>
                  <td>{host.hostname}</td>
                  <td>
                    {host.provisioning?.distro}{" "}
                    {host.provisioning?.version}
                  </td>
                  <td>{host.profile}</td>
                  <td className="cell-mac">
                    {host.identity?.mac?.[0] ?? "—"}
                  </td>
                  <td className="cell-action">Editar →</td>
                </tr>
              ))}
            </tbody>
          </table>
          {hosts.length === 0 && (
            <p className="empty-msg">No hay hosts configurados.</p>
          )}
        </div>
      )}
    </AppShell>
  );
}

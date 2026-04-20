import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { useHosts } from "../hooks/useHosts";
import { useEditorStore } from "../stores/editorStore";

export default function HostsPage() {
  const { data: hosts, isLoading, isError } = useHosts();
  const navigate = useNavigate();
  const hasDraft = useEditorStore((s) => s.hasDraft);

  const displayHosts = (hosts ?? []).filter(
    (h) => h.id !== "default" && h.name !== "default"
  );

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
                <th>Hostname</th>
                <th>Distro</th>
                <th>Perfil</th>
                <th>MAC principal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayHosts.map((host) => {
                const key = host.id ?? host.name;
                const dirty = hasDraft(key);
                return (
                  <tr
                    key={key}
                    className="host-row"
                    onClick={() => navigate(`/hosts/${key}`)}
                  >
                    <td className="cell-name">
                      {host.hostname}
                      {dirty && <span className="draft-dot" title="Cambios sin guardar" />}
                    </td>
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
                );
              })}
            </tbody>
          </table>
          {displayHosts.length === 0 && !isLoading && (
            <p className="empty-msg">No hay hosts configurados.</p>
          )}
        </div>
      )}
    </AppShell>
  );
}

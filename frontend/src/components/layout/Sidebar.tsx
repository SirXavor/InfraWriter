import { useHosts } from "../../hooks/useHosts";
import { useNavigate } from "react-router-dom";

export default function Sidebar() {
  const { data: hosts, isLoading, isError, error } = useHosts();
  const navigate = useNavigate();

  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">InfraWriter</h2>

      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span>Hosts</span>
        </div>

        {isLoading && <p>Cargando...</p>}

        {isError && <p>Error...</p>}

        {hosts && (
          <ul className="host-list">
            {hosts.map((host) => (
              <li
                key={host.name}
                className="host-list-item"
                onClick={() => navigate(`/hosts/${host.name}`)}
              >
                <div className="host-name">{host.name}</div>
                <div className="host-meta">
                  {host.hostname} · {host.provisioning.distro}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
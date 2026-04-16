import { useHosts } from "../../hooks/useHosts";
import { useNavigate, useParams } from "react-router-dom";
import { useEditorStore } from "../../stores/editorStore";

export default function Sidebar() {
  const { data: hosts, isLoading, isError, error } = useHosts();
  const navigate = useNavigate();
  const { hostId: currentHostId } = useParams();

  const hasDraft = useEditorStore((s) => s.hasDraft);

  const realHosts = (hosts ?? []).filter((host) => host.id);

  function handleNavigate(targetHostId: string) {
    if (
      currentHostId &&
      currentHostId !== targetHostId &&
      hasDraft(currentHostId)
    ) {
      const confirmed = window.confirm(
        "Tienes cambios sin guardar. ¿Quieres salir igualmente?"
      );

      if (!confirmed) return;
    }

    navigate(`/hosts/${targetHostId}`);
  }

  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">InfraWriter</h2>

      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <span>Hosts</span>
        </div>

        {isLoading && <p className="sidebar-message">Cargando hosts...</p>}

        {isError && (
          <p className="sidebar-message error">
            Error cargando hosts:{" "}
            {error instanceof Error ? error.message : "desconocido"}
          </p>
        )}

        {!isLoading && !isError && realHosts.length === 0 && (
          <p className="sidebar-message">No hay hosts</p>
        )}

        {!isLoading && !isError && realHosts.length > 0 && (
          <ul className="host-list">
            {realHosts.map((host) => (
              <li
                key={host.id}
                className="host-list-item"
                onClick={() => handleNavigate(host.id!)}
              >
                <div className="host-name">
                  {host.name}
                  {hasDraft(host.id!) && (
                    <span className="dirty-indicator">*</span>
                  )}
                </div>

                <div className="host-meta">
                  {host.hostname} · {host.provisioning.distro}
                </div>

                {host.identity?.mac?.[0] && (
                  <div className="host-meta">
                    MAC: {host.identity.mac[0]}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
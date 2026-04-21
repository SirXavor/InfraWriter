import { useRoles } from "../../hooks/useCatalog";

// Roles that cannot coexist — selecting one deselects the others
const K8S_EXCLUSIVE = ["k3s-edge", "k3s", "k8s", "k8s-core", "kubernetes"];

interface Props {
  value: string[];
  onChange: (roles: string[]) => void;
}

export default function RolesSelector({ value = [], onChange }: Props) {
  const { data: roles = [], isLoading } = useRoles();

  if (isLoading) return <p className="sidebar-message">Cargando roles...</p>;

  function toggleRole(roleName: string) {
    if (value.includes(roleName)) {
      onChange(value.filter((r) => r !== roleName));
    } else {
      let next = [...value];
      if (K8S_EXCLUSIVE.includes(roleName)) {
        next = next.filter((r) => !K8S_EXCLUSIVE.includes(r));
      }
      onChange([...next, roleName]);
    }
  }

  return (
    <div className="roles-container">
      {roles.map((role) => {
        const selected = value.includes(role.name);
        return (
          <div
            key={role.name}
            className={`role-chip${selected ? " selected" : ""}`}
            onClick={() => toggleRole(role.name)}
            title={role.description || undefined}
          >
            {role.display_name || role.name}
          </div>
        );
      })}
    </div>
  );
}

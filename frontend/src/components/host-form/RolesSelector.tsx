import { useRoles } from "../../hooks/useCatalog";

const REQUIRED_ROLES = ["automation"];

interface Props {
  value: string[];
  onChange: (roles: string[]) => void;
}

export default function RolesSelector({ value = [], onChange }: Props) {
  const { data: roles = [], isLoading } = useRoles();

  if (isLoading) return <p className="sidebar-message">Cargando roles...</p>;

  const effective = Array.from(new Set([...REQUIRED_ROLES, ...value]));

  function toggleRole(roleName: string) {
    if (REQUIRED_ROLES.includes(roleName)) return;
    if (effective.includes(roleName)) {
      onChange(effective.filter((r) => r !== roleName));
    } else {
      onChange([...effective, roleName]);
    }
  }

  return (
    <div className="roles-container">
      {roles.map((role) => {
        const selected = effective.includes(role.name);
        const required = REQUIRED_ROLES.includes(role.name);
        return (
          <div
            key={role.name}
            className={`role-chip ${selected ? "selected" : ""} ${required ? "required" : ""}`}
            onClick={() => toggleRole(role.name)}
            title={role.description || (required ? "Rol requerido" : undefined)}
          >
            {role.display_name || role.name}
            {required && <span className="role-required-mark"> •</span>}
          </div>
        );
      })}
    </div>
  );
}

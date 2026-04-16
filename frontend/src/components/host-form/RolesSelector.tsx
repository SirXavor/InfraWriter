import { useRoles } from "../../hooks/useCatalog";

interface Props {
  value: string[];
  onChange: (roles: string[]) => void;
}

export default function RolesSelector({ value = [], onChange }: Props) {
  const { data: roles = [], isLoading } = useRoles();

  if (isLoading) return <p>Cargando roles...</p>;

  function toggleRole(role: string) {
    if (value.includes(role)) {
      onChange(value.filter((r) => r !== role));
    } else {
      onChange([...value, role]);
    }
  }

  return (
    <div className="roles-container">
      {roles.map((role) => {
        const selected = value.includes(role);

        return (
          <div
            key={role}
            className={`role-chip ${selected ? "selected" : ""}`}
            onClick={() => toggleRole(role)}
          >
            {role}
          </div>
        );
      })}
    </div>
  );
}
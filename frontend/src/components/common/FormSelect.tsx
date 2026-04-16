import type { SelectHTMLAttributes } from "react";

interface Option {
  value: string;
  label: string;
}

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Option[];
  placeholder?: string;
  error?: string;
}

export default function FormSelect({
  label,
  options,
  placeholder = "Selecciona una opción",
  error,
  ...props
}: FormSelectProps) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>

      <select className="form-select" {...props}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error && <div className="form-error">{error}</div>}
    </div>
  );
}
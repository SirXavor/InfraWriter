import type { InputHTMLAttributes } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export default function FormInput({
  label,
  error,
  ...props
}: FormInputProps) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      <input className="form-input" {...props} />
      {error && <div className="form-error">{error}</div>}
    </div>
  );
}
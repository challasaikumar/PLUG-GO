import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { FieldRequired } from "@/components/ui/FieldRequired";

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  children: ReactNode;
};

export function SelectField({
  label,
  error,
  id,
  className,
  children,
  required,
  ...props
}: SelectFieldProps) {
  const selectId = id ?? props.name ?? "select";
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className={className}>
      <label className="field-label" htmlFor={selectId}>
        {label}
        {required ? <FieldRequired /> : null}
      </label>
      <div className={cn("field-control", error && "field-control--error")}>
        <select
          id={selectId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          {...props}
        >
          {children}
        </select>
      </div>
      {error ? (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  help?: string;
};

export function TextAreaField({
  label,
  error,
  help,
  id,
  className,
  required,
  ...props
}: TextAreaFieldProps) {
  const areaId = id ?? props.name ?? "message";
  const errorId = error ? `${areaId}-error` : undefined;
  const helpId = help ? `${areaId}-help` : undefined;

  return (
    <div className={className}>
      <label className="field-label" htmlFor={areaId}>
        {label}
        {required ? <FieldRequired /> : null}
      </label>
      <div className={cn("field-control field-control--area", error && "field-control--error")}>
        <textarea
          id={areaId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, helpId].filter(Boolean).join(" ") || undefined}
          {...props}
        />
      </div>
      {error ? (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
      {help && !error ? (
        <p className="field-help" id={helpId}>
          {help}
        </p>
      ) : null}
    </div>
  );
}

type CheckboxFieldProps = {
  name: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  error?: string;
  required?: boolean;
  onBlur?: () => void;
};

export function CheckboxField({
  name,
  checked,
  onChange,
  label,
  error,
  required,
  onBlur,
}: CheckboxFieldProps) {
  const id = name;
  return (
    <div>
      <label className="checkbox-field" htmlFor={id}>
        <input
          id={id}
          name={name}
          type="checkbox"
          checked={checked}
          required={required}
          onChange={(event) => onChange(event.target.checked)}
          onBlur={onBlur}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span className="type-small">{label}</span>
      </label>
      {error ? (
        <p className="field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { FieldRequired } from "./FieldRequired";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  help?: string;
  trailing?: ReactNode;
  leading?: ReactNode;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { label, error, help, trailing, leading, id, className, disabled, required, ...inputProps },
  ref,
) {
  const inputId = id ?? inputProps.name ?? "field";
  const errorId = error ? `${inputId}-error` : undefined;
  const helpId = help ? `${inputId}-help` : undefined;

  return (
    <div className={className}>
      <label className="field-label" htmlFor={inputId}>
        {label}
        {required ? <FieldRequired /> : null}
      </label>
      <div
        className={cn(
          "field-control",
          error && "field-control--error",
          disabled && "field-control--disabled",
        )}
      >
        {leading}
        <input
          id={inputId}
          ref={ref}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={[errorId, helpId].filter(Boolean).join(" ") || undefined}
          {...inputProps}
        />
        {trailing}
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
});

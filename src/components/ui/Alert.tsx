import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import {
  IconCheckCircle,
  IconClose,
  IconInfo,
  IconWarningDiamond,
} from "./icons";

export type AlertVariant = "info" | "success" | "warning" | "error";

type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  onDismiss?: () => void;
};

function AlertIcon({ variant }: { variant: AlertVariant }) {
  if (variant === "success") return <IconCheckCircle />;
  if (variant === "warning" || variant === "error") return <IconWarningDiamond />;
  return <IconInfo />;
}

export function Alert({
  variant = "info",
  title,
  children,
  onDismiss,
}: AlertProps) {
  const role = variant === "error" ? "alert" : "status";

  return (
    <div className={cn("alert", `alert--${variant}`)} role={role}>
      <AlertIcon variant={variant} />
      <div style={{ flex: 1, minWidth: 0 }}>
        {title ? (
          <p className="type-small" style={{ fontWeight: 600, margin: "0 0 4px" }}>
            {title}
          </p>
        ) : null}
        <div className="type-small">{children}</div>
      </div>
      {onDismiss ? (
        <button
          type="button"
          className="png-btn png-btn--outline png-btn--sm"
          style={{ minWidth: 44, padding: 0, width: 44, borderColor: "currentColor" }}
          onClick={onDismiss}
          aria-label="Dismiss"
        >
          <IconClose />
        </button>
      ) : null}
    </div>
  );
}

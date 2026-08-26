import type { ReactNode } from "react";
import { Button, type ButtonVariant } from "./Button";
import { IconInfo } from "./icons";

type EmptyAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: ButtonVariant;
};

type EmptyStateProps = {
  title: string;
  body: string;
  icon?: ReactNode;
  action?: EmptyAction;
  secondaryAction?: EmptyAction;
};

function ActionButton({ action }: { action: EmptyAction }) {
  if (action.href) {
    return (
      <Button href={action.href} variant={action.variant ?? "primary"} block>
        {action.label}
      </Button>
    );
  }
  return (
    <Button onClick={action.onClick} variant={action.variant ?? "primary"} block>
      {action.label}
    </Button>
  );
}

export function EmptyState({
  title,
  body,
  icon,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div
      className="paper-card"
      style={{
        padding: 24,
        background: "var(--color-surface-inset)",
        textAlign: "left",
      }}
    >
      <div style={{ marginBottom: 12, color: "var(--color-text-secondary)" }}>
        {icon ?? <IconInfo />}
      </div>
      <h2 className="type-h3" style={{ margin: "0 0 8px" }}>
        {title}
      </h2>
      <p className="type-body" style={{ margin: "0 0 16px", color: "var(--color-text-secondary)" }}>
        {body}
      </p>
      {action ? (
        <div style={{ display: "grid", gap: 8 }}>
          <ActionButton action={action} />
          {secondaryAction ? (
            <ActionButton
              action={{ ...secondaryAction, variant: secondaryAction.variant ?? "outline" }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

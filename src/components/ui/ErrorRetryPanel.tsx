import { Button } from "./Button";
import { IconWarningDiamond } from "./icons";

type ErrorRetryPanelProps = {
  title?: string;
  body?: string;
  onRetry?: () => void;
  offline?: boolean;
};

export function ErrorRetryPanel({
  title,
  body,
  onRetry,
  offline = false,
}: ErrorRetryPanelProps) {
  const heading = title ?? (offline ? "No connection" : "We could not load stations.");
  const message =
    body ??
    (offline
      ? "Check your network and try again. The list is not available offline yet."
      : "Something went wrong while loading this section.");

  return (
    <div className="alert alert--error" role="alert">
      <IconWarningDiamond />
      <div style={{ flex: 1 }}>
        <p className="type-h3" style={{ margin: "0 0 8px", fontSize: 20 }}>
          {heading}
        </p>
        <p className="type-small" style={{ margin: "0 0 16px" }}>
          {message}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {onRetry ? (
            <Button variant="primary" size="sm" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
          <Button href="/support" variant="outline" size="sm">
            Get support
          </Button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { ErrorRetryPanel } from "@/components/ui/ErrorRetryPanel";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-png" style={{ padding: "48px 0 80px" }}>
      <ErrorRetryPanel
        title="This page could not be shown"
        body="An unexpected error occurred. Retry, or contact support if it continues."
        onRetry={reset}
      />
    </div>
  );
}

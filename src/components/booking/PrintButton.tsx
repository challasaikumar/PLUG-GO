"use client";

import { Button } from "@/components/ui/Button";

export function PrintButton({ label = "Print / download" }: { label?: string }) {
  return (
    <Button type="button" variant="outline" onClick={() => window.print()}>
      {label}
    </Button>
  );
}

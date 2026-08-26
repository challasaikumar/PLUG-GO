"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function RemoveSavedStationButton({ savedId }: { savedId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function remove() {
    setLoading(true);
    try {
      const response = await fetch(`/api/account/saved-stations/${savedId}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
      if (response.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" size="sm" variant="outline" loading={loading} onClick={remove}>
      Remove
    </Button>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { loginHref } from "@/lib/auth/return-path";

type SaveStationButtonProps = {
  slug: string;
  returnPath: string;
  signedIn: boolean;
  initiallySaved: boolean;
};

export function SaveStationButton({
  slug,
  returnPath,
  signedIn,
  initiallySaved,
}: SaveStationButtonProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!signedIn) {
    return (
      <Button href={loginHref(returnPath)} variant="outline" size="sm">
        Sign in to save
      </Button>
    );
  }

  async function toggle() {
    setLoading(true);
    setMessage(null);
    try {
      if (saved) {
        const response = await fetch(`/api/account/saved-stations/${encodeURIComponent(slug)}`, {
          method: "DELETE",
          credentials: "same-origin",
        });
        if (!response.ok) {
          setMessage("The station could not be removed from your list.");
          return;
        }
        setSaved(false);
      } else {
        const response = await fetch("/api/account/saved-stations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ slug }),
        });
        if (!response.ok) {
          setMessage("Only published stations can be saved.");
          return;
        }
        setSaved(true);
        track(ANALYTICS_EVENTS.station_saved, { source: "station_page" });
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button type="button" variant={saved ? "outline" : "secondary"} size="sm" loading={loading} onClick={toggle}>
        {saved ? "Remove saved station" : "Save station"}
      </Button>
      {message ? (
        <p className="type-small" style={{ margin: "8px 0 0", color: "var(--color-error-fg)" }} role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function subscribeOnline(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

export function PwaProvider({ installPromptEnabled = false }: { installPromptEnabled?: boolean }) {
  const online = useSyncExternalStore(subscribeOnline, () => navigator.onLine, () => true);
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const enable = process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_ENABLE_SW === "true";
    if (!enable) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" });
  }, []);

  useEffect(() => {
    function onPrompt(event: Event) {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
      track(ANALYTICS_EVENTS.pwa_install_prompt_shown, { surface: "banner" });
    }
    function onInstalled() {
      setInstallEvent(null);
      track(ANALYTICS_EVENTS.pwa_installed, { surface: "browser" });
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  return (
    <>
      {!online ? (
        <div className="container-png" style={{ paddingTop: 12 }}>
          <Alert variant="warning" title="You are offline">
            Live station status, prices, and account pages are not treated as fresh. Reconnect to see current data.
          </Alert>
        </div>
      ) : null}
      {installPromptEnabled && installEvent && !dismissed ? (
        <div className="container-png" style={{ paddingTop: 12 }}>
          <Alert
            variant="info"
            title="Install Plug and Go"
            onDismiss={() => {
              setDismissed(true);
              setInstallEvent(null);
            }}
          >
            Optional shortcut for this device. Finding a charger still works in the browser.
            <span style={{ display: "inline-block", marginLeft: 12 }}>
              <Button
                type="button"
                size="sm"
                onClick={async () => {
                  await installEvent.prompt();
                  setInstallEvent(null);
                }}
              >
                Install
              </Button>
            </span>
          </Alert>
        </div>
      ) : null}
    </>
  );
}

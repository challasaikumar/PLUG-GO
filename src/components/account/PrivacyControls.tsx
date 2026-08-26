"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { CheckboxField } from "@/components/forms/Fields";
import { TextInput } from "@/components/ui/TextInput";
import { ANALYTICS_EVENTS, track } from "@/lib/analytics";
import { validateDeleteConfirmation } from "@/lib/fields";

type PrivacyControlsProps = {
  productUpdates: boolean;
  marketingSms: boolean;
  marketingEmail: boolean;
};

export function PrivacyControls({
  productUpdates,
  marketingSms,
  marketingEmail,
}: PrivacyControlsProps) {
  const router = useRouter();
  const [prefs, setPrefs] = useState({ productUpdates, marketingSms, marketingEmail });
  const [prefMessage, setPrefMessage] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [confirmationError, setConfirmationError] = useState<string | undefined>();
  const [understood, setUnderstood] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  async function savePrefs(event: FormEvent) {
    event.preventDefault();
    setLoading("prefs");
    setPrefMessage(null);
    try {
      const response = await fetch("/api/account/privacy/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(prefs),
      });
      const body = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !body?.ok) {
        setPrefMessage(body?.error || "Preferences could not be saved.");
        return;
      }
      setPrefMessage("Preferences saved on this account.");
    } finally {
      setLoading(null);
    }
  }

  async function downloadData() {
    setLoading("export");
    setExportMessage(null);
    try {
      const response = await fetch("/api/account/privacy/export", {
        method: "POST",
        credentials: "same-origin",
      });
      if (!response.ok) {
        setExportMessage("The export could not be created.");
        return;
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "plug-and-go-data-export.json";
      anchor.click();
      URL.revokeObjectURL(url);
      track(ANALYTICS_EVENTS.privacy_export_requested, { format: "json" });
      setExportMessage("A copy of the data held on this account was downloaded. This is not a legal compliance certificate.");
    } finally {
      setLoading(null);
    }
  }

  async function requestDeletion(event: FormEvent) {
    event.preventDefault();
    setDeleteError(null);
    if (!understood) {
      setDeleteError("Confirm that you understand this creates a request, not an immediate erase.");
      return;
    }
    const confirmIssue = validateDeleteConfirmation(confirmation);
    if (confirmIssue) {
      setConfirmationError(confirmIssue);
      setDeleteError(confirmIssue);
      return;
    }
    setConfirmationError(undefined);
    setLoading("delete");
    try {
      const response = await fetch("/api/account/privacy/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ confirmation }),
      });
      const body = (await response.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!response.ok || !body?.ok) {
        setDeleteError(body?.error || "The deletion request could not be recorded.");
        return;
      }
      track(ANALYTICS_EVENTS.deletion_requested, { method: "authenticated_confirmation" });
      router.replace("/login");
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div style={{ display: "grid", gap: 32 }}>
      <form className="paper-card" style={{ padding: 20, display: "grid", gap: 12 }} onSubmit={savePrefs}>
        <h2 className="type-h3" style={{ margin: 0 }}>
          Notification preferences
        </h2>
        <p className="type-small" style={{ margin: 0, color: "var(--color-text-secondary)" }}>
          Marketing is off unless you turn it on. Product updates are operational messages about this website, not
          advertising.
        </p>
        <CheckboxField
          name="productUpdates"
          label="Product updates about this website"
          checked={prefs.productUpdates}
          onChange={(checked) => setPrefs((current) => ({ ...current, productUpdates: checked }))}
        />
        <CheckboxField
          name="marketingSms"
          label="Marketing SMS"
          checked={prefs.marketingSms}
          onChange={(checked) => setPrefs((current) => ({ ...current, marketingSms: checked }))}
        />
        <CheckboxField
          name="marketingEmail"
          label="Marketing email"
          checked={prefs.marketingEmail}
          onChange={(checked) => setPrefs((current) => ({ ...current, marketingEmail: checked }))}
        />
        {prefMessage ? <Alert variant="info">{prefMessage}</Alert> : null}
        <Button type="submit" loading={loading === "prefs"}>
          Save preferences
        </Button>
      </form>

      <section className="paper-card" style={{ padding: 20 }}>
        <h2 className="type-h3" style={{ margin: "0 0 8px" }}>
          Download my data
        </h2>
        <p className="type-small" style={{ margin: "0 0 16px", color: "var(--color-text-secondary)" }}>
          Downloads the account, vehicle, saved-station, and preference records held for this login. Payment and
          invoice data are not included because they are not implemented yet.
        </p>
        {exportMessage ? <Alert variant="info">{exportMessage}</Alert> : null}
        <Button type="button" variant="outline" loading={loading === "export"} onClick={downloadData}>
          Download JSON
        </Button>
      </section>

      <form className="paper-card" style={{ padding: 20, display: "grid", gap: 12 }} onSubmit={requestDeletion}>
        <h2 className="type-h3" style={{ margin: 0 }}>
          Request account deletion
        </h2>
        <Alert variant="warning" title="This is a request, not an instant erase">
          Confirming signs you out and records an auditable deletion request. Data is not hard-deleted from this
          screen. Finance and invoice retention rules will be added only after Phase 8, when those records exist.
        </Alert>
        <CheckboxField
          name="understood"
          required
          label="I understand this submits a deletion request and signs me out"
          checked={understood}
          onChange={setUnderstood}
        />
        <TextInput
          id="delete-confirm"
          name="confirmation"
          label="Type DELETE to confirm"
          required
          autoComplete="off"
          value={confirmation}
          error={confirmationError}
          onChange={(event) => {
            setConfirmation(event.target.value);
            if (confirmationError) setConfirmationError(undefined);
          }}
          onBlur={() => setConfirmationError(validateDeleteConfirmation(confirmation))}
        />
        {deleteError ? <Alert variant="error">{deleteError}</Alert> : null}
        <Button type="submit" variant="destructive" loading={loading === "delete"}>
          Submit deletion request
        </Button>
      </form>
    </div>
  );
}

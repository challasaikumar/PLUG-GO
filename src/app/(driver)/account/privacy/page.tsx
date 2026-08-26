import Link from "next/link";
import { PrivacyControls } from "@/components/account/PrivacyControls";
import { getNotificationPreference } from "@/lib/account/privacy";
import { requireDriverPage } from "@/lib/auth/driver";
import { maskE164 } from "@/lib/auth/phone";
import { pageMeta } from "@/lib/metadata";
import { hasPublished, siteConfig, unpublished } from "@/content/siteConfig";

export const metadata = pageMeta({
  title: "Privacy centre",
  description: "Privacy controls for your Plug and Go driver account.",
  path: "/account/privacy",
  index: false,
});

export default async function PrivacyPage() {
  const driver = await requireDriverPage("/account/privacy");
  const preference = await getNotificationPreference(driver.id);

  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 760 }}>
      <h1 className="type-h1" style={{ margin: "0 0 8px" }}>
        Privacy centre
      </h1>
      <p className="type-body" style={{ margin: "0 0 24px", color: "var(--color-text-secondary)" }}>
        This page describes data this website actually holds for {maskE164(driver.phoneE164)}. It is an implementation
        of account controls, not a legal compliance certificate.
      </p>

      <section style={{ marginBottom: 32 }}>
        <h2 className="type-h3">Data held on this account</h2>
        <ul className="type-body">
          <li>Account and mobile number used to sign in</li>
          <li>Vehicle preferences you save</li>
          <li>Stations you save</li>
          <li>Notification preferences</li>
          <li>Export and deletion request records created from this page</li>
          <li>Booking references, reservation windows, payment status, receipts, and support tickets created from this login</li>
        </ul>
        <p className="type-small" style={{ color: "var(--color-text-secondary)" }}>
          Purpose: authenticate you, remember vehicles and stations you chose, honour notification choices, and show
          reservations you created. Card numbers, CVV, UPI PINs, and gateway secrets are not stored.
        </p>
      </section>

      <section style={{ marginBottom: 32 }}>
        <h2 className="type-h3">Correct my data</h2>
        <p className="type-body">
          Update vehicles and saved stations yourself, or change notification preferences below. For account/mobile
          number corrections, contact the published privacy or grievance address.
        </p>
        <p className="type-small">
          Privacy contact:{" "}
          {hasPublished(siteConfig.contact.grievanceEmail) ? (
            <a className="png-link" href={`mailto:${siteConfig.contact.grievanceEmail}`}>
              {siteConfig.contact.grievanceEmail}
            </a>
          ) : (
            unpublished(siteConfig.contact.grievanceEmail)
          )}
          . Grievance: <Link className="png-link" href="/legal/grievance">Grievance page</Link>.
        </p>
      </section>

      <PrivacyControls
        productUpdates={preference.productUpdates}
        marketingSms={preference.marketingSms}
        marketingEmail={preference.marketingEmail}
      />
    </div>
  );
}

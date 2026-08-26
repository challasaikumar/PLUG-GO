import Link from "next/link";
import { notFound } from "next/navigation";
import { SaveStationButton } from "@/components/account/SaveStationButton";
import { Alert } from "@/components/ui/Alert";
import { AvailabilityChip } from "@/components/ui/AvailabilityChip";
import { Button } from "@/components/ui/Button";
import { ConnectorBadge } from "@/components/ui/ConnectorBadge";
import { DataFreshness } from "@/components/ui/DataFreshness";
import { isStationSaved } from "@/lib/account/saved-stations";
import { getOptionalDriver } from "@/lib/auth/driver";
import { loginHref } from "@/lib/auth/return-path";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { pageMeta } from "@/lib/metadata";
import { resolvePublishedQrContext } from "@/lib/qr/resolve";

export const dynamic = "force-dynamic";
export const robots = { index: false, follow: false };

type PageProps = {
  params: Promise<{ "station-public-id": string; "connector-public-id": string }>;
};

export async function generateMetadata() {
  return pageMeta({
    title: "Station scan",
    description: "QR handoff for a published Plug and Go connector.",
    path: "/scan",
    index: false,
  });
}

export default async function QrScanPage({ params }: PageProps) {
  if (!isDatabaseConfigured()) notFound();
  const resolved = await params;
  const stationPublicId = decodeURIComponent(resolved["station-public-id"] ?? "");
  const connectorPublicId = decodeURIComponent(resolved["connector-public-id"] ?? "");
  const context = await resolvePublishedQrContext(stationPublicId, connectorPublicId);
  if (!context) notFound();

  const driver = await getOptionalDriver();
  const saved = driver ? await isStationSaved(driver.id, context.stationSlug) : false;
  const returnPath = `/scan/${stationPublicId}/${connectorPublicId}`;

  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 720 }}>
      <p className="type-caption" style={{ color: "var(--color-action-primary)", margin: "0 0 8px" }}>
        QR station handoff
      </p>
      <h1 className="type-h1" style={{ margin: "0 0 8px" }}>
        {context.stationName}
      </h1>
      <p className="type-body" style={{ margin: "0 0 16px", color: "var(--color-text-secondary)" }}>
        {[context.locality, context.city, context.state].filter(Boolean).join(", ")}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <AvailabilityChip status={context.publicStatus} />
        <DataFreshness label={context.freshnessLabel} status={context.publicStatus} />
        <ConnectorBadge type={context.connectorTypeLabel} maxKw={context.maxKw} />
      </div>
      {context.guidance ? (
        <p className="type-small" style={{ color: "var(--color-warning-fg)" }}>
          {context.guidance}
        </p>
      ) : null}
      <Alert variant="info" title="This does not start a charge">
        This QR page identifies a published station and connector. Remote start, booking, payment, and charger control
        are not available.
      </Alert>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
        <Button href={context.href}>View station details</Button>
        {driver ? (
          <SaveStationButton
            slug={context.stationSlug}
            returnPath={returnPath}
            signedIn
            initiallySaved={saved}
          />
        ) : (
          <Button href={loginHref(returnPath)} variant="outline">
            Sign in to continue
          </Button>
        )}
      </div>
      <p className="type-small" style={{ marginTop: 24 }}>
        <Link className="png-link" href="/find-charger">
          Find other chargers
        </Link>
      </p>
    </div>
  );
}

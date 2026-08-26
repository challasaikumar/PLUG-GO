import type { ReactNode } from "react";
import Link from "next/link";
import { Accordion } from "@/components/ui/Accordion";
import { Alert } from "@/components/ui/Alert";
import { ArrivalInstructionsCard } from "@/components/ui/ArrivalInstructionsCard";
import { AvailabilityChip } from "@/components/ui/AvailabilityChip";
import { TrackedDirectionsButton } from "@/components/analytics/TrackedDirectionsButton";
import { ConnectorBadge } from "@/components/ui/ConnectorBadge";
import { DataFreshness } from "@/components/ui/DataFreshness";
import { StationCard } from "@/components/ui/StationCard";
import { SupportEscalationCard } from "@/components/ui/SupportEscalationCard";
import { StationBookingPanel, type StationBookingOffer } from "@/components/booking/StationBookingPanel";
import { PilotStartPanel, type PilotConnector } from "@/components/stations/PilotStartPanel";
import { StationConnectorLiveList } from "@/components/stations/StationConnectorLiveList";
import { accessTypeLabel, connectorTypeLabel } from "@/lib/catalogue/labels";
import type { PublicStation, PublicStationListItem } from "@/lib/catalogue/station-service";
import { listItemToCard } from "@/components/finder/listItemToCard";
import { appleMapsDirectionsUrl, formatFullAddress, googleMapsDirectionsUrl } from "@/lib/geo";
import { copy } from "@/content/copy";
import { ProductIcon, safetyIconKind } from "@/components/marketing/ProductIcon";
import { aggregateStationStatus } from "@/lib/finder/station-status";
import { stationFaqs } from "@/lib/stations/faqs";
import { freshnessCopy, statusGuidance } from "@/lib/status";
import type { TariffEstimate } from "@/lib/tariff/estimate";
import { formatInrFromPaise, formatPaisePerKwh, startingPriceLabel } from "@/lib/tariff/format";

type StationDetailProps = {
  station: PublicStation;
  estimate: TariffEstimate | null;
  nearby: PublicStationListItem[];
  cityHref?: string | null;
  saveAction?: ReactNode;
  bookingOffer?: StationBookingOffer;
  stationPath?: string;
  liveUpdatesEnabled?: boolean;
  pilotOffer?: { show: true; connectors: PilotConnector[] } | { show: false };
};

export function StationDetail({
  station,
  estimate,
  nearby,
  cityHref,
  saveAction,
  bookingOffer,
  stationPath,
  liveUpdatesEnabled = false,
  pilotOffer,
}: StationDetailProps) {
  const aggregate = aggregateStationStatus(station.connectors);
  const lastUpdated = freshnessCopy({
    status: aggregate.publicStatus,
    statusUpdatedAt: aggregate.statusUpdatedAt ?? station.provenance.statusUpdatedAt,
  });
  const guidance = statusGuidance(aggregate.publicStatus);
  const address = formatFullAddress({
    ...station.address,
    city: station.city,
    state: station.state,
  });
  const googleHref = googleMapsDirectionsUrl(station.latitude, station.longitude);
  const appleHref = appleMapsDirectionsUrl(station.latitude, station.longitude);
  const locality = [station.address.locality, station.city, station.state].filter(Boolean).join(", ");
  const maxKw = station.connectors.reduce((highest, connector) => Math.max(highest, connector.maxKw), 0);
  const faqs = stationFaqs(station);
  const amenities = station.amenities.map((item) => item.trim()).filter(Boolean);
  const arrivalSteps = station.arrivalInstructions
    ? station.arrivalInstructions
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  return (
    <article className="station-page">
      <nav className="station-breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link className="png-link" href="/">
              Home
            </Link>
          </li>
          <li>
            <Link className="png-link" href="/find-charger">
              Find a charger
            </Link>
          </li>
          {cityHref ? (
            <li>
              <Link className="png-link" href={cityHref}>
                {station.city}
              </Link>
            </li>
          ) : null}
          <li aria-current="page">{station.name}</li>
        </ol>
      </nav>

      <header className="station-hero">
        <p className="type-caption" style={{ color: "var(--color-action-primary)", margin: "0 0 8px" }}>
          {locality}
        </p>
        <h1 className="type-h1" style={{ margin: "0 0 12px" }}>
          {station.name}
        </h1>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <AvailabilityChip status={aggregate.publicStatus} />
          <DataFreshness label={lastUpdated} status={aggregate.publicStatus} />
        </div>
        {guidance ? (
          <p className="type-small" style={{ margin: "8px 0 0", color: "var(--color-warning-fg)" }}>
            {guidance}
          </p>
        ) : null}
        <p className="type-body" style={{ margin: "16px 0 0", color: "var(--color-text-secondary)" }}>
          {address}
        </p>
        <div className="station-hero-actions">
          <TrackedDirectionsButton href={googleHref} stationSlug={station.slug}>
            Get directions
          </TrackedDirectionsButton>
          <TrackedDirectionsButton href={appleHref} stationSlug={station.slug} variant="outline">
            Apple Maps
          </TrackedDirectionsButton>
          {saveAction}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          {Array.from(
            new Map(
              station.connectors.map((connector) => [
                `${connector.connectorType}-${connector.maxKw}`,
                connector,
              ]),
            ).values(),
          ).map((connector) => (
            <ConnectorBadge
              key={`${connector.connectorType}-${connector.maxKw}`}
              type={connectorTypeLabel(connector.connectorType)}
              maxKw={connector.maxKw}
            />
          ))}
        </div>
        <p className="type-small" style={{ margin: "12px 0 0", color: "var(--color-text-secondary)" }}>
          {accessTypeLabel(station.access.type)} · {station.access.hoursSummary}
          {maxKw ? ` · up to ${maxKw} kW` : ""}
          {startingPriceLabel(station.tariff?.energyPaisePerKwh)
            ? ` · ${startingPriceLabel(station.tariff?.energyPaisePerKwh)}`
            : ""}
        </p>
      </header>

      <div className="station-layout">
        <div>
          <section className="page-section" aria-labelledby="directions-heading">
            <h2 id="directions-heading" className="type-h2">
              Directions and arrival
            </h2>
            <ArrivalInstructionsCard
              address={address}
              steps={arrivalSteps}
              mapsHref={googleHref}
              appleMapsHref={appleHref}
            />
            {station.address.landmark ? (
              <p className="type-body" style={{ marginTop: 16 }}>
                Landmark: {station.address.landmark}
              </p>
            ) : null}
            {station.access.parkingDetails ? (
              <p className="type-body" style={{ marginTop: 8, color: "var(--color-text-secondary)" }}>
                Parking: {station.access.parkingDetails}
                {station.access.parkingFeeApplies === true ? " A parking fee may apply." : ""}
              </p>
            ) : null}
          </section>

          <section className="page-section" aria-labelledby="connectors-heading">
            <h2 id="connectors-heading" className="type-h2">
              Connectors
            </h2>
            <p className="type-body" style={{ color: "var(--color-text-secondary)" }}>
              {station.installedConnectorCount} installed · {station.availableConnectorCount} currently
              available (fresh Available only; Unknown and Stale are never counted as Available).
            </p>
            <StationConnectorLiveList
              stationSlug={station.slug}
              liveEnabled={Boolean(liveUpdatesEnabled)}
              connectors={station.connectors.map((connector) => ({
                connectorId: connector.connectorId,
                publicRef: connector.publicRef,
                evseLabel: connector.evseLabel,
                connectorIndex: connector.connectorIndex,
                connectorType: connector.connectorType,
                maxKw: connector.maxKw,
                publicStatus: connector.publicStatus,
                statusUpdatedAt: connector.statusUpdatedAt,
                vehicleCompatibilityNotes: connector.vehicleCompatibilityNotes,
              }))}
            />
          </section>

          {estimate ? (
            <section className="page-section" aria-labelledby="tariff-heading">
              <h2 id="tariff-heading" className="type-h2">
                Price estimate
              </h2>
              <p className="type-small" style={{ color: "var(--color-text-secondary)" }}>
                Sample for 10 kWh
                {station.tariff
                  ? ` at ${formatPaisePerKwh(station.tariff.energyPaisePerKwh)} energy`
                  : ""}
                . Effective {new Date(estimate.effectiveFrom).toLocaleDateString("en-IN")}
                {estimate.effectiveTo
                  ? ` until ${new Date(estimate.effectiveTo).toLocaleDateString("en-IN")}`
                  : ""}
                .
              </p>
              <table className="station-tariff-table">
                <caption className="visually-hidden">Tariff estimate line items</caption>
                <tbody>
                  {estimate.lines.map((line) => (
                    <tr key={`${line.code}-${line.label}`}>
                      <th scope="row">{line.label}</th>
                      <td className="font-mono">{formatInrFromPaise(line.amountPaise)}</td>
                    </tr>
                  ))}
                  <tr>
                    <th scope="row">Estimated total</th>
                    <td className="font-mono">{formatInrFromPaise(estimate.totalPaise)}</td>
                  </tr>
                </tbody>
              </table>
              <Alert variant="info" title="This is an estimate, not an invoice">
                {estimate.disclaimer} Energy + service + parking/idle/reservation + GST − discount. The
                session invoice may differ.
              </Alert>
            </section>
          ) : null}

          <section className="page-section" aria-labelledby="access-heading">
            <h2 id="access-heading" className="type-h2">
              Access, hours, and amenities
            </h2>
            <p className="type-body">{accessTypeLabel(station.access.type)}</p>
            <p className="type-body" style={{ color: "var(--color-text-secondary)" }}>
              {station.access.hoursSummary}
              {station.access.is24_7 === true ? " Recorded as open 24/7." : ""}
            </p>
            {station.access.restrictions ? (
              <p className="type-body">Restrictions: {station.access.restrictions}</p>
            ) : null}
            {station.access.bookingRequired === true && !bookingOffer?.show ? (
              <Alert variant="warning" title="Booking may be required on site">
                This website does not take a reservation for this station. On-site booking rules may still apply.
              </Alert>
            ) : null}
            {amenities.length > 0 ? (
              <ul className="station-amenity-list">
                {amenities.map((amenity) => (
                  <li key={amenity}>{amenity}</li>
                ))}
              </ul>
            ) : null}
            {station.accessibilityNotes || (station.accessibleBayCount ?? 0) > 0 ? (
              <p className="type-body" style={{ marginTop: 12 }}>
                Accessibility
                {station.accessibleBayCount ? `: ${station.accessibleBayCount} accessible bay(s)` : ""}
                {station.accessibilityNotes ? `. ${station.accessibilityNotes}` : ""}
              </p>
            ) : null}
            {station.paymentMethods.length > 0 ? (
              <p className="type-small" style={{ marginTop: 12, color: "var(--color-text-secondary)" }}>
                Recorded payment methods: {station.paymentMethods.join(", ")}. Unsupported methods are not
                listed.
              </p>
            ) : null}
          </section>

          {pilotOffer?.show ? (
            <PilotStartPanel stationSlug={station.slug} connectors={pilotOffer.connectors} />
          ) : null}

          {bookingOffer && stationPath ? (
            <StationBookingPanel stationSlug={station.slug} stationPath={stationPath} offer={bookingOffer} />
          ) : null}

          {station.photos.length > 0 ? (
            <section className="page-section" aria-labelledby="photos-heading">
              <h2 id="photos-heading" className="type-h2">
                Station photos
              </h2>
              <ul className="station-gallery">
                {station.photos.map((photo) => (
                  <li key={photo.id}>
                    {/* Approved catalogue URLs only; domains are not known at build time. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt={photo.altText} loading="lazy" />
                    {photo.caption ? <p className="type-caption">{photo.caption}</p> : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="page-section" aria-labelledby="safety-heading">
            <h2 id="safety-heading" className="type-h2">
              Safe charging
            </h2>
            <ul className="process-list">
              {copy.safety.guidance[0]?.items.map((item, index) => (
                <li key={item}>
                  <ProductIcon kind={safetyIconKind(index)} className="process-icon" size={56} />
                  <span className="type-body">{item}</span>
                </li>
              ))}
            </ul>
            {station.emergencyInstructions ? (
              <p className="type-body" style={{ marginTop: 16 }}>
                Site note: {station.emergencyInstructions}
              </p>
            ) : null}
            <p style={{ marginTop: 16 }}>
              <a className="png-link" href="/safety">
                Full safe charging guidance
              </a>
              {" · "}
              <a className="png-link" href="/connector-guide">
                Connector guide
              </a>
              {" · "}
              <a className="png-link" href="/pricing">
                Pricing
              </a>
              {cityHref ? (
                <>
                  {" · "}
                  <a className="png-link" href={cityHref}>
                    {station.city} charging guide
                  </a>
                </>
              ) : null}
            </p>
          </section>

          {faqs.length > 0 ? (
            <section className="page-section" aria-labelledby="faq-heading">
              <h2 id="faq-heading" className="type-h2">
                Station questions
              </h2>
              <Accordion items={faqs} />
            </section>
          ) : null}

          {nearby.length > 0 ? (
            <section className="page-section" aria-labelledby="nearby-heading">
              <h2 id="nearby-heading" className="type-h2">
                Nearby published alternatives
              </h2>
              <div className="station-nearby-grid">
                {nearby.map((item) => (
                  <StationCard key={item.stationId} station={listItemToCard(item)} compact />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="station-aside">
          <SupportEscalationCard
            stationId={station.slug}
            phone={station.support.phone ?? undefined}
            email={station.support.email ?? undefined}
            reportHref={`/support?topic=connector_issue&stationId=${encodeURIComponent(station.slug)}`}
          />
        </aside>
      </div>
    </article>
  );
}

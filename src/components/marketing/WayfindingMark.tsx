import { AvailabilityChip } from "@/components/ui/AvailabilityChip";
import { DataFreshness } from "@/components/ui/DataFreshness";
import { ProductIcon } from "@/components/marketing/ProductIcon";

/** Geometric wayfinding panel — not a station photo and not a live bay. */
export function WayfindingMark() {
  return (
    <figure className="wayfinding" aria-label="Wayfinding specimen, not a live station">
      <div className="wayfinding-bay">
        <span className="wayfinding-line" />
        <span className="wayfinding-line" />
        <span className="wayfinding-pedestal" />
        <ProductIcon kind="arrive" className="wayfinding-icon" size={88} />
      </div>
      <figcaption>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <AvailabilityChip status="unknown" />
          <DataFreshness label="Availability not live" status="unknown" />
        </div>
        <p className="type-small" style={{ margin: "8px 0 0", color: "var(--color-text-secondary)" }}>
          Status always uses a word, an icon, and a colour. This is a specimen, not a published charger.
        </p>
      </figcaption>
    </figure>
  );
}

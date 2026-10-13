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
        <p className="type-small" style={{ margin: "8px 0 0", color: "var(--color-text-secondary)" }}>
          This is a specimen, not a published charger. Live bay availability is not shown.
        </p>
      </figcaption>
    </figure>
  );
}

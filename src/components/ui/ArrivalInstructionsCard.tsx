"use client";

import { Button } from "./Button";
import { IconPin } from "./icons";
import { useToast } from "./Toast";
import { ProductIcon, processIconKind } from "@/components/marketing/ProductIcon";

type ArrivalInstructionsCardProps = {
  address?: string;
  steps?: string[];
  mapsHref?: string;
  appleMapsHref?: string;
};

export function ArrivalInstructionsCard({
  address,
  steps = [],
  mapsHref,
  appleMapsHref,
}: ArrivalInstructionsCardProps) {
  const hasAddress = Boolean(address);

  return (
    <section className="paper-card" style={{ padding: 16 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <IconPin />
        <h2 className="type-h3" style={{ margin: 0, fontSize: 20 }}>
          Arrival
        </h2>
      </div>
      {hasAddress ? (
        <p className="type-body" style={{ margin: "0 0 12px" }}>
          {address}
        </p>
      ) : (
        <p className="type-small" style={{ margin: "0 0 12px", color: "var(--color-text-secondary)" }}>
          Arrival notes not published.
        </p>
      )}
      {steps.length > 0 ? (
        <ol style={{ margin: "0 0 16px", paddingLeft: 0, listStyle: "none" }}>
          {steps.map((step, index) => (
            <li
              key={step}
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 8,
                alignItems: "center",
              }}
            >
              <ProductIcon kind={processIconKind(index)} className="process-icon" size={40} />
              <span>{step}</span>
            </li>
          ))}
        </ol>
      ) : null}
      <div style={{ display: "grid", gap: 8 }}>
        {mapsHref ? (
          <Button href={mapsHref} variant="primary" block external>
            Get directions in Google Maps
          </Button>
        ) : (
          <Button variant="primary" block disabled>
            Get directions
          </Button>
        )}
        {appleMapsHref ? (
          <Button href={appleMapsHref} variant="outline" block external>
            Get directions in Apple Maps
          </Button>
        ) : null}
        {hasAddress ? (
          <CopyAddressButton address={address ?? ""} />
        ) : null}
      </div>
    </section>
  );
}

function CopyAddressButton({ address }: { address: string }) {
  const { push } = useToast();
  return (
    <Button
      variant="outline"
      block
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(address);
          push("Address copied.", "success");
        } catch {
          push("Copy was blocked. The address is still visible on the page.", "error");
        }
      }}
    >
      Copy address
    </Button>
  );
}

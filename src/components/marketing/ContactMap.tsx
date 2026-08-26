import { LocationMap } from "@/components/maps/LocationMap";
import { hasPublished } from "@/content/siteConfig";
import type { PublicMapConfig } from "@/lib/maps/config";

type ContactMapProps = {
  address: string | null;
  mapConfig: PublicMapConfig;
};

export function ContactMap({ address, mapConfig }: ContactMapProps) {
  const published = hasPublished(address);
  const mapsHref = published
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address ?? "")}`
    : null;

  return (
    <section className="atlas" aria-labelledby="atlas-heading">
      <div className="atlas__stage">
        <div className="atlas__field">
          <LocationMap
            config={mapConfig}
            ariaLabel="Map of India. No office pin is shown until a registered address is published."
          />
        </div>
        <div className="atlas__hud">
          <p className="atlas__kicker">Visit</p>
          <h2 id="atlas-heading">Find us on the map</h2>
          <p className="atlas__coords">
            <span>N —</span>
            <span>E —</span>
          </p>
          <div className="atlas__card">
            <p className="atlas__label">Registered address</p>
            {published ? (
              <>
                <p className="atlas__address">{address}</p>
                {mapsHref ? (
                  <a className="png-link" href={mapsHref} rel="noopener noreferrer" target="_blank">
                    Open in maps
                  </a>
                ) : null}
              </>
            ) : (
              <p className="atlas__address">
                Not published yet. This is an India overview, not a head office. A pin will appear when the
                registered address is confirmed.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

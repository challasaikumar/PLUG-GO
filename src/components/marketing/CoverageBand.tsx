import { Button } from "@/components/ui/Button";
import { LocationMap } from "@/components/maps/LocationMap";
import { copy } from "@/content/copy";
import type { PublicMapConfig } from "@/lib/maps/config";
import { INDIA_OVERVIEW_LABEL } from "@/lib/maps/view";

type CoverageBandProps = {
  mapConfig: PublicMapConfig;
};

function CompassMark() {
  return (
    <svg className="coverage__compass" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <circle cx="24" cy="24" r="18.5" />
      <circle cx="24" cy="24" r="3" />
      <path d="M24 8.5 L27.2 24 L24 21.2 L20.8 24 Z" />
      <text x="24" y="14">
        N
      </text>
    </svg>
  );
}

export function CoverageBand({ mapConfig }: CoverageBandProps) {
  const home = copy.home;

  return (
    <section className="coverage" aria-labelledby="coverage-heading">
      <div className="coverage__inner">
        <div className="coverage__legend">
          <div className="coverage__legend-head">
            <p className="coverage__kicker">{home.coverageKicker}</p>
            <h2 id="coverage-heading">{home.coverageTitle}</h2>
          </div>
          <div className="coverage__legend-body">
            <p className="coverage__lead">{home.coverageLead}</p>
            <ul className="coverage__facts">
              <li>Country overview</li>
              <li>No office pin</li>
              <li>Stations live in Find</li>
            </ul>
            <div className="coverage__actions">
              <Button href="/find-charger">Find a charger</Button>
              <Button href="/contact" variant="outline">
                Talk to us
              </Button>
            </div>
          </div>
        </div>

        <div className="coverage__stage">
          <div className="coverage__viewport">
            <div className="coverage__map">
              <LocationMap
                config={mapConfig}
                ariaLabel="Map of India. Country overview only — not a registered office pin."
              />
            </div>
            <div className="coverage__veil" aria-hidden="true" />
            <span className="coverage__tick coverage__tick--tl" aria-hidden="true" />
            <span className="coverage__tick coverage__tick--tr" aria-hidden="true" />
            <span className="coverage__tick coverage__tick--bl" aria-hidden="true" />
            <span className="coverage__tick coverage__tick--br" aria-hidden="true" />
            <div className="coverage__hud">
              <CompassMark />
              <div>
                <p className="coverage__coords">{INDIA_OVERVIEW_LABEL}</p>
                <p className="coverage__hud-note">Overview · not a site pin</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

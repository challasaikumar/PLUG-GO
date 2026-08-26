import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { marketingAssets } from "@/content/marketingAssets";

const offers = [
  {
    href: "/find-charger",
    title: "Find a charger",
    body: "Search published stations by city, pincode, or landmark. Check connectors and access without an account.",
    cta: "Find a charger",
    image: marketingAssets.cardFind,
    width: 999,
    height: 999,
  },
  {
    href: "/host-a-charger",
    title: "Host a charger",
    body: "Tell us the city, property type, and approximate bays. Hosting is a conversation, not a live listing.",
    cta: "Check site eligibility",
    image: marketingAssets.cardHost,
    width: 999,
    height: 999,
  },
  {
    href: "/solutions/fleets",
    title: "Fleets",
    body: "Share the city and connector needs. No SLA figures, portals, or invented network size on this page.",
    cta: "Plan fleet charging",
    image: marketingAssets.cardFleets,
    width: 1600,
    height: 1066,
  },
] as const;

export function OfferCards() {
  return (
    <section className="offer-section" aria-labelledby="offer-heading">
      <h2 id="offer-heading" className="type-h2" style={{ margin: "0 0 24px" }}>
        What you can do here
      </h2>
      <div className="offer-grid">
        {offers.map((offer) => (
          <article key={offer.href} className="offer-card">
            <Image
              src={offer.image}
              alt=""
              width={offer.width}
              height={offer.height}
              sizes="(min-width: 768px) 33vw, 100vw"
              unoptimized
            />
            <div className="offer-card__body">
              <h3 className="type-h3" style={{ margin: 0 }}>
                {offer.title}
              </h3>
              <p className="type-small" style={{ margin: 0, color: "var(--color-text-secondary)", flex: 1 }}>
                {offer.body}
              </p>
              <Button href={offer.href}>{offer.cta}</Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

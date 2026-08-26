import { PageIntro } from "@/components/marketing/PageIntro";
import { GuideCrumbs, GuidePage, GuideSiblings } from "@/components/marketing/GuideChrome";
import { TariffSchematic } from "@/components/marketing/TariffSchematic";
import { PricingCalculator } from "@/components/content/PricingCalculator";
import { JsonLd } from "@/components/seo/JsonLd";
import { copy } from "@/content/copy";
import { breadcrumbListJsonLd } from "@/lib/seo/jsonld";
import { pageMeta } from "@/lib/metadata";
import {
  IconBan,
  IconBookmark,
  IconBolt,
  IconCalendar,
  IconClock,
  IconFile,
  IconList,
  IconParking,
  IconPercent,
  IconReceipt,
  IconSupport,
  IconTag,
} from "@/components/ui/icons";

const breadcrumbs = [
  { name: "Home", path: "/" },
  { name: "Pricing", path: "/pricing" },
];

const principleIcons = [IconList, IconCalendar, IconBan, IconReceipt] as const;

const feeLines = [
  {
    Icon: IconBolt,
    dt: "Energy",
    dd: "Charge for electricity, usually per kWh at the approved rate.",
  },
  {
    Icon: IconSupport,
    dt: "Service",
    dd: "Operator service charge, if the approved tariff includes one, often also per kWh.",
  },
  {
    Icon: IconParking,
    dt: "Parking",
    dd: "A flat or per-minute parking fee only if that line exists on the approved tariff.",
  },
  {
    Icon: IconClock,
    dt: "Idle",
    dd: "A fee after charging ends, often after a grace period, if the tariff includes idle.",
  },
  {
    Icon: IconBookmark,
    dt: "Reservation",
    dd: "A booking hold fee if a later reservation product exists and the tariff includes it. This website does not take reservations yet.",
  },
  {
    Icon: IconPercent,
    dt: "GST",
    dd: "Goods and Services Tax at the rate recorded on the tariff version, applied after discounts.",
  },
  {
    Icon: IconTag,
    dt: "Discounts",
    dd: "Only a named, approved discount. Unpublished offers are not shown as a lower price.",
  },
  {
    Icon: IconFile,
    dt: "Invoice",
    dd: "A later session invoice can differ from any on-page estimate. Estimates are not tax invoices.",
  },
] as const;

export const metadata = pageMeta({
  title: copy.pricing.title,
  description: copy.pricing.description,
  path: "/pricing",
});

export default function PricingPage() {
  const pricing = copy.pricing;

  return (
    <GuidePage variant="pricing">
      <JsonLd data={breadcrumbListJsonLd(breadcrumbs)} />
      <GuideCrumbs current="Pricing" />
      <PageIntro title={pricing.h1} lead={pricing.lead} eyebrow="Pricing" />

      <section className="price-board" aria-labelledby="principle-heading">
        <div>
          <h2 id="principle-heading">{pricing.principleTitle}</h2>
          <ol className="rule-board">
            {pricing.principles.map((item, index) => {
              const Icon = principleIcons[index];
              return (
                <li key={item}>
                  <span className="price-mark" aria-hidden="true">
                    <Icon />
                  </span>
                  <p>{item}</p>
                </li>
              );
            })}
          </ol>
        </div>
        <TariffSchematic />
      </section>

      <section className="bill-index" aria-labelledby="fee-types-heading">
        <h2 id="fee-types-heading">What can appear on a bill</h2>
        <dl className="bill-index__list">
          {feeLines.map((row) => (
            <div key={row.dt} className="bill-row">
              <span className="price-mark" aria-hidden="true">
                <row.Icon />
              </span>
              <div>
                <dt>{row.dt}</dt>
                <dd>{row.dd}</dd>
              </div>
            </div>
          ))}
        </dl>
      </section>

      <PricingCalculator />
      <GuideSiblings current="/pricing" />
    </GuidePage>
  );
}

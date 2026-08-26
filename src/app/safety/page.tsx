import { PageIntro } from "@/components/marketing/PageIntro";
import { GuideCrumbs, GuidePage, GuideSiblings } from "@/components/marketing/GuideChrome";
import { Button } from "@/components/ui/Button";
import { copy } from "@/content/copy";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: copy.safety.title,
  description: copy.safety.description,
  path: "/safety",
});

export default function SafetyPage() {
  const safety = copy.safety;

  return (
    <GuidePage variant="safety">
      <GuideCrumbs current="Safety" />
      <PageIntro title={safety.h1} lead={safety.lead} eyebrow="Safety" />

      <aside className="caution-strip" role="status">
        <strong>No unverified certificates</strong>
        <p>
          This page does not claim type tests, electrical compliance, or continuous monitoring. Those appear only with
          dated evidence.
        </p>
      </aside>

      <div className="inspect-grid">
        {safety.guidance.map((group) => {
          const headingId = `safety-${group.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
          return (
            <section key={group.title} className="inspect-card" aria-labelledby={headingId}>
              <h2 id={headingId}>{group.title}</h2>
              <ol>
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            </section>
          );
        })}
      </div>

      <section className="report-band" aria-labelledby="fault-heading">
        <div>
          <p className="guide-panel__kicker">If the bay looks wrong</p>
          <h2 id="fault-heading">Report a fault</h2>
          <p>
            If equipment looks unsafe, do not use it. Then send a support enquiry with the station ID if you have one.
          </p>
          <p>
            For immediate danger, use local emergency services first. Plug and Go does not publish a 24/7 emergency
            dispatch number on this site.
          </p>
        </div>
        <Button href="/support?topic=unsafe_fault">Report unsafe equipment</Button>
      </section>
      <GuideSiblings current="/safety" />
    </GuidePage>
  );
}

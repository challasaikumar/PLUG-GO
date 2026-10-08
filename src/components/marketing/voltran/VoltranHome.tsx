import Image from "next/image";
import { ContactDesk } from "@/components/marketing/voltran/ContactDesk";
import { HomeFaq } from "@/components/marketing/voltran/HomeFaq";
import { LocationShowcase } from "@/components/marketing/voltran/LocationShowcase";
import { SectionHead } from "@/components/marketing/voltran/SectionHead";
import { TeamStack } from "@/components/marketing/voltran/TeamStack";
import { voltran } from "@/content/voltran";

export function VoltranHome({
  deliveryConfigured,
  defaultEmail = "",
}: {
  deliveryConfigured: boolean;
  defaultEmail?: string;
}) {
  return (
    <div className="vt">
      <section className="vt-section vt-team" id="team" aria-labelledby="team-heading">
        <TeamStack />
      </section>

      <section className="vt-section vt-app" id="app" aria-labelledby="app-heading">
        <div className="vt-wrap vt-wrap--wide">
          <SectionHead id="app-heading">How PLUG & GO Works</SectionHead>
          <p className="vt-lead">{voltran.app.lead}</p>
          <div className="vt-how">
            {voltran.app.steps.map((step) => (
              <article key={step.n} className={`vt-step vt-how__s${step.n}`}>
                <span className="vt-step-n">{step.n}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
            <div className="vt-how__stage">
              <Image
                className="vt-how__device"
                src="/nikol-ev.assets.Woblo/evimage.webp"
                alt="PLUG & GO app showing charge hubs and live station availability"
                width={1200}
                height={1502}
                sizes="(min-width: 960px) 400px, 80vw"
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>

      <section className="vt-section vt-locations" id="locations" aria-labelledby="locations-heading">
        <div className="vt-wrap vt-wrap--wide">
          <LocationShowcase />
        </div>
      </section>

      <section className="vt-section vt-contact" id="contact" aria-labelledby="contact-heading">
        <div className="vt-wrap vt-wrap--wide">
          <ContactDesk deliveryConfigured={deliveryConfigured} defaultEmail={defaultEmail} />
        </div>
      </section>

      <HomeFaq />
    </div>
  );
}

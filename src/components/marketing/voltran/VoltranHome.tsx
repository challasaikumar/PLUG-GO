import Image from "next/image";
import { ContactDesk } from "@/components/marketing/voltran/ContactDesk";
import { HomeFaq } from "@/components/marketing/voltran/HomeFaq";
import { ChargerPowerStrip } from "@/components/marketing/voltran/ChargerPowerStrip";
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
                src="/nikol-ev.assets.Woblo/plug%26goIMage.png"
                alt="PLUG & GO app showing charge hubs and live station availability"
                width={718}
                height={899}
                sizes="(min-width: 960px) 400px, 80vw"
                unoptimized
              />
            </div>
          </div>
          <ChargerPowerStrip />
          <article className="vt-manual">
            <div className="vt-manual__photo">
              <Image
                fill
                src={voltran.app.manual.image}
                alt="Station staff plugging in a vehicle at a PLUG & GO charge hub"
                sizes="(min-width: 768px) 52vw, 92vw"
                className="vt-manual__img"
                unoptimized
              />
            </div>
            <div className="vt-manual__copy">
              <p className="vt-manual__kicker">{voltran.app.manual.kicker}</p>
              <h3>{voltran.app.manual.title}</h3>
              <p>{voltran.app.manual.body}</p>
            </div>
          </article>
        </div>
      </section>

      <section className="vt-section vt-locations" id="locations" aria-labelledby="locations-heading">
        <div className="vt-wrap vt-wrap--wide">
          <LocationShowcase />
        </div>
      </section>

      <section className="vt-section vt-team" id="team" aria-labelledby="team-heading">
        <TeamStack />
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

"use client";

import ScrollBaseAnimation from "@/components/ui/scroll-text-marque";

export function ChargeMarquee() {
  return (
    <section className="vt-marque" aria-label="PLUG & GO charge hubs">
      <p className="visually-hidden">
        PLUG & GO is setting up state of the art EV charge hubs across highways and cities,
        offering a seamless charging experience to EV owners. Hubs are manned and open 24x7,
        with 120, 180 and 240 kW DC fast chargers.
      </p>
      <ScrollBaseAnimation
        delay={400}
        baseVelocity={-3}
        clasname="vt-marque__line vt-marque__line--bright"
      >
        PLUG & GO is setting up state of the art EV charge hubs across highways and cities
      </ScrollBaseAnimation>
      <ScrollBaseAnimation delay={400} baseVelocity={3} clasname="vt-marque__line">
        A seamless charging experience for EV owners · manned, open 24x7 · 120 / 180 / 240 kW fast chargers
      </ScrollBaseAnimation>
    </section>
  );
}

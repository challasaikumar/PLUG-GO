export const howToCharge = {
  title: "How to charge an EV at Plug and Go",
  description:
    "A practical first-time guide to finding a compatible Plug and Go charger, checking access and price, arriving safely, and getting help. App, QR, and RFID start are not on this website yet.",
  h1: "How to charge, from search to unplug",
  lead: "Use this guide before you travel. It describes what this website can do today and what still happens at the bay. Plug and Go does not start charging, take payment, or book a bay from this site yet.",
  steps: [
    {
      title: "Find a compatible station",
      body: "Open Find a charger and search by city, pincode, or landmark. Check the connector type and maximum kW against your vehicle inlet. Open the station page for access rules and hours. Do not assume a city has Plug and Go chargers unless a published station page exists.",
    },
    {
      title: "Check access, availability, and tariff",
      body: "Read whether the site is public, restricted, or guest-only. Availability is shown with a last-updated time. Unknown, Offline, and Stale are never labelled Available. If a tariff is approved, the station page shows an estimate; if not, it says price is not published. An estimate is not an invoice.",
    },
    {
      title: "Arrive and park safely",
      body: "Follow the station page arrival notes and the maps link. Park only in the marked EV bay. Leave space for the cable. Do not block ramps, fire exits, or adjacent bays. If the bay is flooded, damaged, or marked out of use, do not plug in.",
    },
    {
      title: "App, QR, and RFID",
      body: "This website does not start a session by app, QR, or RFID. If a host or charger screen supports a method on site, follow the on-site instructions. We will not show Start charging or Scan to start until a backend can authorise it.",
    },
    {
      title: "Begin, monitor, and finish conceptually",
      body: "Once a session is authorised at the charger, stay with the vehicle until charging has clearly started. Watch for fault lights or unusual heat, smell, or noise. When you are done, stop from the charger interface if required, unplug only if it is safe, and return the cable to its holder.",
    },
    {
      title: "Get support when something goes wrong",
      body: "If charging does not start, the connector will not seat, or equipment looks unsafe, stop. Use Support with the station name from the page. For immediate danger, use local emergency services first. This site is not an emergency dispatch line.",
    },
  ],
  safetyTitle: "Safety before you plug in",
  safety: [
    "Confirm the connector matches your vehicle. Do not force a fit.",
    "Inspect the cable, inlet, and bay. Leave any unit that looks damaged or flooded.",
    "Do not open cabinets or reset hardware yourself.",
    "Keep children and pets clear of the cable while it is in use.",
  ],
  faq: [
    {
      id: "account",
      question: "Do I need an account to find a charger?",
      answer:
        "No. Search and station pages work without signing in. Driver login, booking, and in-app payment are not on this website yet.",
    },
    {
      id: "qr",
      question: "Can I start charging with a QR code on this site?",
      answer:
        "No. QR, RFID, and remote start are not offered here. If a charger on site shows its own start method, that is separate from this website.",
    },
    {
      id: "wrong",
      question: "What if the bay does not match the page?",
      answer:
        "Do not use equipment that looks unsafe. Report the station through Support with what you saw. Status on the website can be Unknown or Stale; those are never shown as Available.",
    },
  ],
} as const;

export const connectorGuide = {
  title: "EV connector and charging-power guide",
  description:
    "How AC and DC charging differ, which connector types Plug and Go can record, and why charging speed varies. We do not list vehicle-model compatibility without approved data.",
  h1: "Connectors, kW, and what they mean",
  lead: "A station page names the connector type and maximum kW as recorded in the Plug and Go catalogue. This guide explains those labels. It is not a list of which car models work, and it is not a promise that every type exists at every site.",
  acDcTitle: "AC and DC, briefly",
  acDc: [
    {
      title: "AC (alternating current)",
      body: "Typically slower charging through an onboard charger in the car. Type 2 and Bharat AC-001 are AC types in this catalogue. Useful for longer stays: workplaces, hotels, and parking that is not a brief highway stop.",
    },
    {
      title: "DC (direct current)",
      body: "Typically faster charging that bypasses the onboard charger. CCS2, CHAdeMO, GB/T DC, and Bharat DC-001 are DC types in this catalogue. The kW on the page is the charger maximum, not a guarantee of what your vehicle will draw.",
    },
  ],
  typesTitle: "Connector types this catalogue can record",
  typesIntro:
    "These are the types in Plug and Go’s data model. A public station page lists only the types installed at that site. Other and Unknown mean the record is incomplete — not a reason to force a connector.",
  kwTitle: "kW and estimated time",
  kwBody:
    "Kilowatts describe power. A rough illustration: time in hours ≈ energy needed (kWh) ÷ session power (kW). A 40 kWh top-up at a steady 40 kW is about an hour in that illustration. Real sessions are shorter or longer. Use the illustration to compare orders of magnitude, not to plan an arrival to the minute.",
  varyTitle: "Why the same charger can feel slower",
  vary: [
    "The vehicle’s inlet and onboard limits may be below the charger’s kW.",
    "Battery state of charge: many cars taper power as they fill.",
    "Temperature: cold or very hot packs often charge more slowly.",
    "Shared cabinets, software limits, or a second vehicle on the same unit can reduce power.",
    "The catalogue kW is a recorded maximum, not a live measurement of your session.",
  ],
  vehiclesTitle: "Vehicle compatibility",
  vehiclesBody:
    "Check the inlet on your car and the connector label on the station page. Plug and Go does not publish a model-by-model compatibility table on this website. If a station record includes a specific note, it appears on that station page only.",
  faq: [
    {
      id: "ccs2",
      question: "Is CCS2 the same as Type 2?",
      answer:
        "No. Type 2 is typically AC. CCS2 is typically DC and uses a different inlet combination. Match the label on your vehicle to the station page.",
    },
    {
      id: "speed",
      question: "Will a 60 kW charger always charge at 60 kW?",
      answer:
        "No. Charging speed can vary by vehicle, battery, temperature, and charger. The kW on the page is the recorded maximum for that connector.",
    },
    {
      id: "models",
      question: "Which car models are listed as compatible?",
      answer:
        "None, unless an approved note exists on a specific station page. This guide will not invent a model list.",
    },
  ],
} as const;

export function chargingTimeIllustrationMinutes(energyKwh: number, powerKw: number): number | null {
  if (!Number.isFinite(energyKwh) || !Number.isFinite(powerKw) || energyKwh <= 0 || powerKw <= 0) {
    return null;
  }
  return Math.round((energyKwh / powerKw) * 60);
}

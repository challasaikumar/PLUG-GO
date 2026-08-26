import { siteConfig } from "./siteConfig";

export const copy = {
  home: {
    title: siteConfig.name,
    description:
      "Plug and Go helps EV drivers find a compatible charger, understand the price, and get help. Search published stations without creating an account.",
    eyebrow: siteConfig.name,
    h1: siteConfig.promise,
    lead: "A charging network you can read in a hurry: compatibility, access, price, and a human help path. Availability is shown only from published stations and never as Available when the status is Unknown, Offline, or Stale.",
    primaryCta: "Find a charger",
    secondaryCta: "Talk to us",
    howTitle: "How charging will work",
    howIntro:
      "The intended driver journey is Find → Arrive / scan → Charge / pay. Only the first step is on this website today. Scan, booking, and payment will appear when operations can honour them.",
    coverageKicker: "Coverage",
    coverageTitle: "India, in overview",
    coverageLead:
      "Plug and Go is built for charging in India. This map is a country view, not a registered office. Find a published station, or write to us if you need a person.",
    howSteps: [
      {
        title: "Find",
        now: true,
        body: "Search published stations by name, city, landmark, or pincode. Check connectors, access, and price, then get directions. No account is required.",
      },
      {
        title: "Arrive / scan",
        now: false,
        body: "On site, the bay should match the page: entrance, connector, and access rules. QR or RFID start is later — it will not appear as a public action until a backend can authorise it.",
      },
      {
        title: "Charge / pay",
        now: false,
        body: "Energy, fees, and GST will be itemised before you commit. In-app payment and invoices are later. We will not show a rupee rate until a versioned tariff is approved.",
      },
    ],
    compatibilityTitle: "Compatibility and price, in plain language",
    compatibilityBody:
      "A station page will name the connector type and maximum kW as recorded — CCS2, Type 2, and others only if they exist in the catalogue. Price will separate energy, service fee, parking or idle or reservation, GST, and any named discount, with an effective date. Missing data will say missing.",
    audienceTitle: "Who this site is for",
    safetyTitle: "If something is wrong",
    safetyBody:
      "Do not use a connector that looks damaged or is marked faulted. This website cannot make a site safe, but it will always offer a report path. We do not claim 24/7 support until hours are confirmed.",
    learnTitle: "Learn before you travel",
    learnLinks: [
      { href: "/how-to-charge", label: "How to charge", detail: "Find a bay, arrive, and get help." },
      { href: "/connector-guide", label: "Connector and power guide", detail: "AC, DC, kW, and compatibility caveats." },
      { href: "/pricing", label: "How pricing is shown", detail: "Energy, fees, GST, estimates vs invoices." },
      { href: "/safety", label: "Safe charging guidance", detail: "Connector care and fault reporting." },
      { href: "/insights", label: "Insights", detail: "Reviewed articles only — no generated filler." },
      { href: "/support", label: "Get help", detail: "Driver, station, payment, and safety paths." },
    ],
    faq: [
      {
        id: "live",
        question: "Can I see live chargers on this site yet?",
        answer:
          "Yes. Find a charger lists published Plug and Go stations. Availability is shown with a last-updated time. Unknown and Stale are never labelled Available. Booking and in-app charging are not on this site yet.",
      },
      {
        id: "price",
        question: "What will charging cost?",
        answer:
          "Approved tariffs are not published yet. When they are, you will see a breakdown, not a single unexplained number.",
      },
    ],
  },
  findCharger: {
    title: "Find a charger",
    description:
      "Search published Plug and Go EV charging stations in India by city, pincode, landmark, connector, and access. Get directions without creating an account.",
    h1: "Find a compatible charger",
    lead: "Search the published catalogue. The list is the complete way to discover a station — the map is optional and may be unavailable. Directions work without an account. This site does not take bookings or start charging.",
  },
  about: {
    title: "About",
    description:
      "Plug and Go is building a trustworthy EV charging website: compatible chargers, clear prices, and a human help path.",
    h1: "Built for the moment you need a charger",
    lead: "Plug and Go is an India-focused charging network website and future driver platform. We lead with reliability and clarity, not generic green slogans.",
    missionTitle: "Mission",
    mission:
      "Help a driver answer four questions quickly: Is there a compatible charger? Is it accessible? What will it cost? How do I get help if something goes wrong?",
    principlesTitle: "Operating principles",
    principles: [
      {
        title: "Truth before persuasion",
        body: "Status, hours, prices, and proof come from approved records. Unknown stays unknown. Stale is never shown as Available.",
      },
      {
        title: "Driver-first conversion",
        body: "Inspect a station and get directions without an account. Sign-in, booking, and payment wait until they are operationally real.",
      },
      {
        title: "One source of truth",
        body: "Address, connector, tariff, and photos will share one catalogue — not separate marketing copy.",
      },
    ],
    trustTitle: "Safety and trust approach",
    trust:
      "The website cannot certify hardware. It can make faults visible, give connector guidance, and route reports with a station reference. We will not claim uptime, type-test certificates, or 24/7 coverage without evidence.",
    identityTitle: "Business identity",
    identityNote:
      "Legal name, registered address, and GSTIN appear when the client confirms them. They are configuration slots, not invented history.",
  },
  contact: {
    title: "Contact",
    description:
      "Contact Plug and Go for driver support, station issues, fleet or host enquiries, or a general question.",
    h1: "Talk to us",
    lead: "Use the form for driver support, a station issue, fleet or host interest, or a general enquiry. If delivery is not configured, we will say so — we will not pretend a message was sent.",
  },
  support: {
    title: "Support",
    description:
      "Plug and Go help paths for charging that did not start, connector faults, payment or billing questions, and unsafe equipment.",
    h1: "Get help by what went wrong",
    lead: "Choose the path that matches the problem. Live ticketing is not built yet; the form creates an enquiry with optional station or session references so a person can follow up.",
    paths: [
      {
        id: "charging_not_started",
        title: "Charging has not started",
        body: "The connector is plugged in but a session did not begin, or the charger did not respond.",
      },
      {
        id: "connector_issue",
        title: "Connector issue",
        body: "Cable, latch, or inlet problem. Say which connector type if you know it.",
      },
      {
        id: "payment_issue",
        title: "Payment issue",
        body: "A charge or authorisation failed. Online payment is not live on this site yet; use this path if you were asked to pay on site or in another channel.",
      },
      {
        id: "refund_billing",
        title: "Refund or billing",
        body: "Invoice questions or a refund request. Include any reference you have. Refunds follow policy once payments exist.",
      },
      {
        id: "unsafe_fault",
        title: "Unsafe or faulted equipment",
        body: "Do not use the connector. Move to a safe place if needed, then report the station ID and what you saw.",
      },
      {
        id: "general_support",
        title: "General support",
        body: "Access, hours, or information that looks wrong on a page.",
      },
    ],
    emergencyTitle: "If you are in immediate danger",
    emergency:
      "Use local emergency services first. This website is not an emergency dispatch line and does not claim 24/7 on-call coverage until hours are confirmed.",
  },
  safety: {
    title: "Safety",
    description:
      "Safe EV charging guidance from Plug and Go: connector care, fault reporting, and emergency steps. No unverified certifications.",
    h1: "Charge only when the bay looks right",
    lead: "These are practical steps for drivers. They are not a substitute for on-site judgement, and they are not a claim that Plug and Go stations are certified or continuously monitored.",
    guidance: [
      {
        title: "Before you plug in",
        items: [
          "Confirm the connector type matches your vehicle.",
          "Check the cable, inlet, and bay for damage, flooding, or exposed wiring.",
          "If a screen or sign says faulted or do not use, leave it and report the station.",
        ],
      },
      {
        title: "Connector care",
        items: [
          "Do not force a connector. If it will not seat, stop.",
          "Keep the inlet clear of debris. Do not use a wet or muddy gun if it looks unsafe.",
          "Return the cable to its holder so the next driver can see it is free.",
        ],
      },
      {
        title: "If something fails",
        items: [
          "Unplug only if you can do so safely.",
          "Do not open cabinets or reset hardware yourself.",
          "Report the station ID, time, and what you observed via Support.",
        ],
      },
    ],
  },
  pricing: {
    title: "Pricing",
    description:
      "How Plug and Go shows charging prices: energy, service fee, parking or idle or reservation, GST, and discount — with an effective date. Educational estimates use labelled example values unless an approved station tariff applies.",
    h1: "Know the price before you commit",
    lead: "When a tariff is approved, you will see each line, not a single unexplained figure. This page explains the breakdown and offers an educational calculator. Example rupee totals are hypothetical. A Plug and Go rupee estimate appears only for an approved published tariff. Neither figure is an exact cost or a tax invoice.",
    principleTitle: "Transparent-pricing principle",
    principles: [
      "Show energy, service fee, parking / idle / reservation (only if they apply), GST, and named discounts separately.",
      "Publish the tariff effective date. Do not reuse an old rate without dates.",
      "If a price is not approved, say “Price not published.” Do not guess from another city.",
      "An estimate is not a final invoice. Session invoices come later, when payment exists.",
    ],
  },
  fleets: {
    title: "Fleet charging",
    description:
      "Talk to Plug and Go about EV charging for a vehicle fleet. No invented SLA or coverage claims.",
    h1: "Charging that fleet operators can inspect",
    lead: "If you run cars, vans, or a depot, start with a short conversation about cities, connectors, and how drivers will find a bay. We will not quote uptime, network size, or contracted rates until those facts exist.",
    cta: "Plan fleet charging",
    processTitle: "What happens after you enquire",
    process: [
      "You send city, approximate vehicle count, and connector needs.",
      "We qualify the request. Documents are not required on this first form.",
      "If there is a fit, a person follows up to discuss sites and operations — not a self-serve portal yet.",
    ],
  },
  workplace: {
    title: "Workplace charging",
    description:
      "Employee and visitor EV charging at a workplace. Enquire without invented utilisation claims.",
    h1: "Workplace bays that staff can actually use",
    lead: "Workplace charging fails when access, hours, and support are unclear. This page is for property and facilities teams who want a conversation about employee or visitor charging — not a driver looking for a public bay tonight.",
    cta: "Talk to an expert",
    processTitle: "A practical conversation",
    process: [
      "Tell us the city, property type, and roughly how many bays you are considering.",
      "We ask about power availability only after the first qualification.",
      "Installation, tariffs, and access rules stay unpublished until a real site assessment exists.",
    ],
  },
  host: {
    title: "Host a charger",
    description:
      "Property owners and hosts: check whether a site could host Plug and Go charging. No invented revenue share.",
    h1: "Host charging where people already park",
    lead: "Malls, hotels, fuel stations, and workplaces can host chargers if space, power, and access are workable. We do not publish revenue shares, utilisation, or guaranteed occupancy. This form starts a site conversation.",
    cta: "Check site eligibility",
    processTitle: "How hosting starts",
    process: [
      "Share city, property type, and an approximate bay count.",
      "We qualify ownership or authority to install.",
      "A site assessment, if offered, comes after that — not from this first form.",
    ],
    askTitle: "What we need to know first",
    ask: [
      "City and property type",
      "Approximate parking bays you could dedicate",
      "Whether you can authorise electrical work",
      "A contact who can reply",
    ],
  },
} as const;

export const legalCopy = {
  privacy: {
    title: "Privacy",
    description: "Draft privacy notice for Plug and Go. Not a final legal document.",
    h1: "Privacy notice (draft)",
    sections: [
      {
        heading: "Who we are",
        body: "The legal entity that operates Plug and Go will appear here when confirmed. Until then, treat this as a template, not a controller identity.",
      },
      {
        heading: "What we collect on this website",
        body: "Enquiry forms may collect name, email, phone, organisation or property details, city, optional station or session references, and your message. Location is not collected until a finder exists. We do not run marketing pixels until a consent policy is live.",
      },
      {
        heading: "Why we collect it",
        body: "To respond to support, fleet, host, or general enquiries you submit. We do not sell this information.",
      },
      {
        heading: "Processors",
        body: "If an enquiry webhook or inbox is configured, your message is sent to that destination. Maps, SMS, and payment processors are not used on this site yet.",
      },
      {
        heading: "Your rights",
        body: "You may ask for access, correction, or deletion of enquiry data you sent, via the grievance or support contact once published. DPDP notice text will be completed with counsel.",
      },
    ],
  },
  terms: {
    title: "Terms",
    description: "Draft website terms for Plug and Go. Not a final legal document.",
    h1: "Website terms (draft)",
    sections: [
      {
        heading: "The service today",
        body: "This website is a public information and enquiry site. It does not yet provide live station availability, booking, remote start, or payment.",
      },
      {
        heading: "Accuracy",
        body: "We aim to publish only approved facts. Unpublished fields are labelled as such. You should not rely on this site for emergency services.",
      },
      {
        heading: "Acceptable use",
        body: "Do not submit false reports, scrape in a way that disrupts the service, or attempt to control chargers through this website.",
      },
    ],
  },
  refunds: {
    title: "Refunds",
    description: "Draft refund principles for Plug and Go. Online charging payments are not offered yet.",
    h1: "Refunds and cancellation (draft)",
    sections: [
      {
        heading: "Online payments on this website",
        body: "Plug and Go does not take charging payments on this website yet. There is nothing to refund through this form for an in-site session.",
      },
      {
        heading: "When payments exist",
        body: "A later policy will cover booking cancellation, failed sessions, and GST invoices. It will be versioned and dated. Do not assume instant refunds.",
      },
      {
        heading: "Disputes",
        body: "Billing questions can be sent via Support → Refund or billing, with any reference you have.",
      },
    ],
  },
  accessibility: {
    title: "Accessibility",
    description: "Accessibility statement draft for the Plug and Go website.",
    h1: "Accessibility (draft)",
    sections: [
      {
        heading: "Intent",
        body: "We aim for WCAG 2.2 AA on public pages: keyboard use, visible focus, labelled errors, and a list equivalent when a map exists later.",
      },
      {
        heading: "Known limits",
        body: "Station photos and some third-party map widgets (later) may need extra text alternatives. Report barriers via Contact.",
      },
      {
        heading: "Contact",
        body: "Use the grievance or contact details once published. Until then, the contact form is the route.",
      },
    ],
  },
  grievance: {
    title: "Grievance",
    description: "Draft grievance route for Plug and Go. Officer details are configuration slots.",
    h1: "Grievance (draft)",
    sections: [
      {
        heading: "How to raise a grievance",
        body: "Use the contact form (reason: general enquiry) or the grievance email once it is published. Include dates and any station or enquiry reference.",
      },
      {
        heading: "Officer",
        body: "Name, email, and phone for the grievance officer are not published until the client confirms them. They are slots in site configuration, not invented people.",
      },
    ],
  },
} as const;

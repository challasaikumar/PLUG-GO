import { homeFaqs } from "@/content/answers";
import { siteConfig, hasPublished } from "@/content/siteConfig";
import { voltran, mapsUrl } from "@/content/voltran";
import { canonicalUrl, getSiteUrl } from "@/lib/env";
import { SITE_DESCRIPTION } from "@/lib/site";

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export type VisibleFaq = {
  question: string;
  answer: string;
};

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function orgId() {
  return `${getSiteUrl()}/#organization`;
}

function alwaysOpenHours() {
  return DAYS.map((dayOfWeek) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek,
    opens: "00:00",
    closes: "23:59",
  }));
}

export function registeredPostalAddress() {
  return {
    "@type": "PostalAddress",
    streetAddress: "7-50/1, 3rd Floor, GNR Heights, Ramavarappadu",
    addressLocality: "Vijayawada",
    addressRegion: "Andhra Pradesh",
    postalCode: "521108",
    addressCountry: "IN",
  };
}

export function hyderabadPostalAddress() {
  return {
    "@type": "PostalAddress",
    streetAddress: "#401, Aruna Towers, 6-3-661/10/1&2, Sangeeth Nagar, Somajiguda",
    addressLocality: "Hyderabad",
    addressRegion: "Telangana",
    postalCode: "500082",
    addressCountry: "IN",
  };
}

export function organizationJsonLd() {
  const url = getSiteUrl();
  const organization: Record<string, unknown> = {
    "@type": "Organization",
    "@id": orgId(),
    name: siteConfig.name,
    legalName: siteConfig.identity.legalEntity ?? siteConfig.name,
    url: `${url}/`,
    logo: {
      "@type": "ImageObject",
      url: `${url}/nikol-ev.assets.Woblo/Firefly_RemoveBackground.png`,
    },
    image: `${url}/nikol-ev.assets.Woblo/Firefly_RemoveBackground.png`,
    description: SITE_DESCRIPTION,
    slogan: siteConfig.identity.brandTagline,
    foundingLocation: {
      "@type": "Place",
      name: "Vijayawada, Andhra Pradesh",
    },
    founder: {
      "@type": "Person",
      name: "Ranga Rao",
      jobTitle: "Founder",
    },
    areaServed: [
      { "@type": "AdministrativeArea", name: "Andhra Pradesh" },
      { "@type": "AdministrativeArea", name: "Telangana" },
      { "@type": "Country", name: "India" },
    ],
    knowsAbout: [
      "Electric vehicle charging",
      "DC fast charging",
      "EV charge hubs",
      "Manned EV charging stations",
    ],
  };

  if (hasPublished(siteConfig.identity.registeredAddress)) {
    organization.address = registeredPostalAddress();
    organization.location = {
      "@type": "Place",
      name: "PLUG & GO Vijayawada",
      address: registeredPostalAddress(),
    };
  }
  if (hasPublished(siteConfig.contact.supportPhone)) {
    organization.telephone = siteConfig.contact.supportPhone;
  }
  if (hasPublished(siteConfig.contact.supportEmail)) {
    organization.email = siteConfig.contact.supportEmail;
  }

  const contactPoint: Record<string, unknown> = {
    "@type": "ContactPoint",
    contactType: "customer support",
    areaServed: "IN",
    availableLanguage: ["English"],
  };
  if (hasPublished(siteConfig.contact.supportPhone)) {
    contactPoint.telephone = siteConfig.contact.supportPhone;
  }
  if (hasPublished(siteConfig.contact.supportEmail)) {
    contactPoint.email = siteConfig.contact.supportEmail;
  }
  if (hasPublished(siteConfig.contact.supportHours)) {
    contactPoint.hoursAvailable = alwaysOpenHours();
  }
  organization.contactPoint = contactPoint;
  organization.openingHoursSpecification = alwaysOpenHours();
  organization.subOrganization = [
    {
      "@type": "LocalBusiness",
      name: "PLUG & GO Hyderabad",
      address: hyderabadPostalAddress(),
      parentOrganization: { "@id": orgId() },
    },
  ];

  const sameAs = [
    siteConfig.social.twitter,
    siteConfig.social.linkedin,
    siteConfig.social.instagram,
    siteConfig.social.facebook,
    siteConfig.social.youtube,
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
  if (sameAs.length) organization.sameAs = sameAs;

  return {
    "@context": "https://schema.org",
    ...organization,
  };
}

export function websiteJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${url}/#website`,
    url: `${url}/`,
    name: siteConfig.name,
    description: SITE_DESCRIPTION,
    inLanguage: "en-IN",
    publisher: { "@id": orgId() },
  };
}

function omitContext<T extends Record<string, unknown>>(node: T) {
  const { ["@context"]: _context, ...rest } = node;
  return rest;
}

export function siteGraphJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [omitContext(organizationJsonLd()), omitContext(websiteJsonLd())],
  };
}

export function breadcrumbListJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}

export function faqPageJsonLd(faqs: VisibleFaq[]) {
  const visible = faqs.filter((faq) => faq.question.trim() && faq.answer.trim());
  if (visible.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: visible.map((faq) => ({
      "@type": "Question",
      name: faq.question.trim(),
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer.trim(),
      },
    })),
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".faq-accordion__trigger", ".faq-accordion__panel"],
    },
  };
}

export function articleJsonLd(input: {
  headline: string;
  description: string;
  path: string;
  datePublished?: string | Date | null;
  dateModified?: string | Date | null;
  authorName?: string | null;
}) {
  const url = canonicalUrl(input.path);
  const article: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    description: input.description,
    url,
    mainEntityOfPage: url,
    inLanguage: "en-IN",
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      url: `${getSiteUrl()}/`,
    },
  };
  if (input.authorName) {
    article.author = { "@type": "Person", name: input.authorName };
  }
  if (input.datePublished) {
    article.datePublished = new Date(input.datePublished).toISOString();
  }
  if (input.dateModified) {
    article.dateModified = new Date(input.dateModified).toISOString();
  }
  return article;
}

export function howToChargeAppJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: voltran.app.title,
    description: voltran.app.lead,
    inLanguage: "en-IN",
    step: voltran.app.steps.map((step) => ({
      "@type": "HowToStep",
      position: Number(step.n),
      name: step.title,
      text: step.body,
    })),
  };
}

export function chargingHubsJsonLd() {
  const url = getSiteUrl();
  return voltran.hubs.map((hub) => {
    const slug = hub.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const node: Record<string, unknown> = {
      "@type": ["ElectricVehicleChargingStation", "LocalBusiness"],
      "@id": `${url}/#hub-${slug}`,
      name: hub.name,
      description: `${hub.name} EV charging hub in ${hub.area}. Manned, open 24x7, with parking.`,
      url: `${url}/`,
      hasMap: mapsUrl(hub.mapsQuery),
      address: {
        "@type": "PostalAddress",
        streetAddress: hub.address,
        addressLocality: hub.area,
        addressRegion: "Andhra Pradesh",
        postalCode: "533101",
        addressCountry: "IN",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: hub.latitude,
        longitude: hub.longitude,
      },
      parentOrganization: { "@id": orgId() },
      openingHoursSpecification: alwaysOpenHours(),
      amenityFeature: hub.amenities.map((amenity) => ({
        "@type": "LocationFeatureSpecification",
        name: amenity === "OPEN24-7" ? "Open 24x7" : "Parking",
        value: true,
      })),
    };
    if (hasPublished(siteConfig.contact.supportPhone)) {
      node.telephone = siteConfig.contact.supportPhone;
    }
    return node;
  });
}

export function homeDiscoveryJsonLd() {
  const url = getSiteUrl();
  const faq = faqPageJsonLd([...homeFaqs]);
  const howTo = howToChargeAppJsonLd();
  const hubs = chargingHubsJsonLd();
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${url}/#webpage`,
      url: `${url}/`,
      name: `${siteConfig.name} | EV charging hubs in AP & TG`,
      description: SITE_DESCRIPTION,
      inLanguage: "en-IN",
      isPartOf: { "@id": `${url}/#website` },
      about: { "@id": orgId() },
      primaryImageOfPage: {
        "@type": "ImageObject",
        url: `${url}/nikol-ev.assets.Woblo/Firefly_RemoveBackground.png`,
      },
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: [".home-hero__title", ".faq-accordion__trigger", ".faq-accordion__panel"],
      },
    },
    {
      "@type": "ItemList",
      name: "Published PLUG & GO charge hubs",
      itemListElement: hubs.map((hub, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: { "@id": hub["@id"] },
      })),
    },
    ...hubs,
    omitContext(howTo),
  ];
  if (faq) {
    graph.push(omitContext(faq));
  }
  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function contactPageJsonLd() {
  const url = canonicalUrl("/contact");
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    "@id": `${url}#contact`,
    url,
    name: "Contact PLUG & GO",
    description:
      "Call, email, or write to PLUG & GO. Offices in Vijayawada and Hyderabad. Support is open 24x7.",
    inLanguage: "en-IN",
    isPartOf: { "@id": `${getSiteUrl()}/#website` },
    about: { "@id": orgId() },
    mainEntity: {
      "@type": "Organization",
      "@id": orgId(),
    },
  };
}

export function collectionPageJsonLd(input: {
  path: string;
  name: string;
  description: string;
  numberOfItems?: number;
}) {
  const url = canonicalUrl(input.path);
  const page: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    url,
    name: input.name,
    description: input.description,
    inLanguage: "en-IN",
    isPartOf: { "@id": `${getSiteUrl()}/#website` },
  };
  if (typeof input.numberOfItems === "number") {
    page.mainEntity = {
      "@type": "ItemList",
      numberOfItems: input.numberOfItems,
    };
  }
  return page;
}

export function blogIndexJsonLd() {
  const url = canonicalUrl("/blogs");
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    url,
    name: voltran.blogs.title,
    description: "PLUG & GO notes on electric vehicles and charging.",
    inLanguage: "en-IN",
    publisher: { "@id": orgId() },
    blogPost: voltran.blogs.posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      author: { "@type": "Person", name: post.author },
      url: `${url}#${post.slug}`,
      inLanguage: "en-IN",
    })),
  };
}

export function containsReviewSchema(value: unknown): boolean {
  const text = JSON.stringify(value);
  return /"@type"\s*:\s*"(AggregateRating|Review)"/.test(text) || /"aggregateRating"|"reviewRating"/.test(text);
}

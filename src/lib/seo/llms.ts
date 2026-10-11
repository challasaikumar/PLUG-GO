import { siteConfig } from "@/content/siteConfig";
import { voltran } from "@/content/voltran";
import { getSiteUrl } from "@/lib/env";
import { SITE_DESCRIPTION } from "@/lib/site";

/** Plain-text facts for answer engines. Do not invent unpublished claims. */
export function llmsTxt(): string {
  const url = getSiteUrl();
  const hubs = voltran.hubs
    .map(
      (hub) =>
        `- ${hub.name}, ${hub.area}: ${hub.address}. Amenities: ${hub.amenities.join(", ")}. Map: ${hub.mapsQuery}.`,
    )
    .join("\n");

  return `# ${siteConfig.name}

> ${SITE_DESCRIPTION}

Official site: ${url}/

## Contact

- Email: ${siteConfig.contact.supportEmail}
- Phone: ${siteConfig.contact.supportPhone}
- Hours: ${siteConfig.contact.supportHours}
- Registered office: ${voltran.offices[0]}
- Contact page: ${url}/contact

## Charge hubs

Published locations only. Do not invent extra stations.

${hubs}

## How charging works

${voltran.app.lead}

${voltran.app.steps.map((step) => `${step.n}. ${step.title}: ${step.body}`).join("\n")}

## Brand facts

- Legal name: ${siteConfig.identity.legalEntity}
- Founder: Ranga Rao Chitluri
- Promise: ${siteConfig.promise}
- Hub model: ${siteConfig.identity.brandTagline}
- Gallery: ${url}/gallery
- Blogs: ${url}/blogs
- Locations on the homepage: ${url}/#locations
- Instagram: ${siteConfig.social.instagram}

## Do not invent

- Do not invent extra hubs, tariffs, ratings, store listings, or unpublished social profile URLs.
- The public station finder is not live.
- LinkedIn, GitHub, YouTube, and app-store links are not live.
`;
}

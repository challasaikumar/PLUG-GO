import { describe, expect, it } from "vitest";
import { canonicalUrl } from "@/lib/env";
import { isSitemapEligiblePath, staticPublicSitemapEntries, toMetadataSitemap } from "./sitemap-entries";
import {
  articleJsonLd,
  breadcrumbListJsonLd,
  containsReviewSchema,
  faqPageJsonLd,
  organizationJsonLd,
} from "./jsonld";
import { stationJsonLd } from "./station-jsonld";
import robots from "@/app/robots";

describe("sitemap eligibility", () => {
  it("includes core public routes with absolute canonical URLs", () => {
    const entries = staticPublicSitemapEntries();
    const paths = entries.map((entry) => entry.path);
    expect(paths).toContain("/");
    expect(paths).toContain("/how-to-charge");
    expect(paths).toContain("/connector-guide");
    expect(paths).toContain("/insights");
    expect(paths).not.toContain("/admin");
    const mapped = toMetadataSitemap(entries);
    expect(mapped.every((row) => row.url.startsWith("http"))).toBe(true);
    expect(mapped.find((row) => row.url.endsWith("/how-to-charge"))?.url).toBe(canonicalUrl("/how-to-charge"));
  });

  it("excludes admin, api, preview, and query URLs", () => {
    expect(isSitemapEligiblePath("/admin/content/preview/city/x")).toBe(false);
    expect(isSitemapEligiblePath("/api/public/stations")).toBe(false);
    expect(isSitemapEligiblePath("/design-system")).toBe(false);
    expect(isSitemapEligiblePath("/find-charger?q=hyderabad")).toBe(false);
    expect(isSitemapEligiblePath("/account")).toBe(false);
    expect(isSitemapEligiblePath("/vehicles")).toBe(false);
    expect(isSitemapEligiblePath("/saved-stations")).toBe(false);
    expect(isSitemapEligiblePath("/login")).toBe(false);
    expect(isSitemapEligiblePath("/scan/st_abc/cn_def")).toBe(false);
    expect(isSitemapEligiblePath("/offline")).toBe(false);
    expect(isSitemapEligiblePath("/bookings")).toBe(false);
    expect(isSitemapEligiblePath("/payments")).toBe(false);
    expect(isSitemapEligiblePath("/invoices")).toBe(false);
    expect(isSitemapEligiblePath("/session/abc")).toBe(false);
    expect(isSitemapEligiblePath("/bookings/abc")).toBe(false);
    expect(isSitemapEligiblePath("/ops")).toBe(false);
    expect(isSitemapEligiblePath("/ops/stations")).toBe(false);
    expect(isSitemapEligiblePath("/technician")).toBe(false);
    expect(isSitemapEligiblePath("/partner")).toBe(false);
    expect(isSitemapEligiblePath("/fleet")).toBe(false);
    expect(isSitemapEligiblePath("/status")).toBe(false);
    expect(isSitemapEligiblePath("/api/health")).toBe(false);
  });

  it("disallows operations portals in robots.txt", () => {
    const rules = robots();
    const first = Array.isArray(rules.rules) ? rules.rules[0] : rules.rules;
    const disallow = first && "disallow" in first ? first.disallow : [];
    expect(disallow).toEqual(
      expect.arrayContaining(["/ops", "/ops/", "/technician", "/partner", "/fleet", "/status", "/status/"]),
    );
  });
});

describe("structured data", () => {
  it("builds Organization JSON-LD from configuration only, without reviews", () => {
    const org = organizationJsonLd() as Record<string, unknown>;
    expect(org["@type"]).toBe("Organization");
    expect(org.name).toBe("Plug and Go");
    expect(org.telephone).toBeUndefined();
    expect(containsReviewSchema(org)).toBe(false);
  });

  it("emits FAQPage schema only when the same FAQs are present", () => {
    expect(faqPageJsonLd([])).toBeNull();
    const faqs = [{ question: "Do I need an account?", answer: "No. Search works without signing in." }];
    const schema = faqPageJsonLd(faqs);
    expect(schema?.["@type"]).toBe("FAQPage");
    expect(schema?.mainEntity).toHaveLength(1);
    expect(schema?.mainEntity?.[0]).toMatchObject({
      "@type": "Question",
      name: "Do I need an account?",
    });
  });

  it("keeps charging-station schema off non-station graphs and omits review markup", () => {
    const crumbs = breadcrumbListJsonLd([
      { name: "Home", path: "/" },
      { name: "How to charge", path: "/how-to-charge" },
    ]);
    expect(JSON.stringify(crumbs)).not.toContain("ElectricVehicleChargingStation");
    const article = articleJsonLd({
      headline: "Title",
      description: "Excerpt",
      path: "/insights/title",
      authorName: "Editor",
    });
    expect(containsReviewSchema(article)).toBe(false);
    const station = stationJsonLd({
      name: "Test station",
      slug: "test-station",
      city: "Hyderabad",
      state: "Telangana",
      latitude: 17.38,
      longitude: 78.48,
      address: { line1: "1 Road", pincode: "500001", country: "IN" },
      access: { type: "public", hoursSummary: "Unknown" },
      connectors: [{ connectorType: "ccs2", maxKw: 60 }],
    });
    expect(JSON.stringify(station)).toContain("ElectricVehicleChargingStation");
    expect(containsReviewSchema(station)).toBe(false);
  });
});

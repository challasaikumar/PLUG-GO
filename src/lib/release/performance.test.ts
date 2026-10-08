import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "../../..");

function read(relative: string) {
  return readFileSync(path.join(root, relative), "utf8");
}

describe("performance budget guards", () => {
  it("does not import map SDKs on ordinary marketing pages", () => {
    const pages = [
      "src/app/page.tsx",
      "src/app/about/page.tsx",
      "src/app/how-to-charge/page.tsx",
      "src/app/pricing/page.tsx",
      "src/app/legal/privacy/page.tsx",
    ];
    for (const page of pages) {
      const source = read(page);
      expect(source).not.toMatch(/MapboxMap|GoogleMap|mapbox-gl|maps\.googleapis/);
      expect(source).not.toMatch(/from "@\/components\/finder\/StationMap"/);
    }
  });

  it("lazy-loads map providers from the finder map wrapper", () => {
    const source = read("src/components/finder/StationMap.tsx");
    expect(source).toMatch(/next\/dynamic/);
    expect(source).toMatch(/ssr:\s*false/);
  });

  it("lazy-loads contact location map providers", () => {
    const contactPage = read("src/app/contact/page.tsx");
    const locationMap = read("src/components/maps/LocationMap.tsx");
    const home = read("src/app/page.tsx");
    expect(contactPage).not.toMatch(/mapbox-gl|maps\.googleapis/);
    expect(home).toMatch(/VoltranHome/);
    expect(home).not.toMatch(/mapbox-gl|maps\.googleapis/);
    expect(locationMap).toMatch(/next\/dynamic/);
    expect(locationMap).toMatch(/ssr:\s*false/);
  });

  it("allows a controlled homepage hero video that respects reduced motion", () => {
    const home = read("src/app/page.tsx");
    const hero = read("src/components/marketing/HeroVideo.tsx");
    expect(home).not.toMatch(/autoPlay/);
    expect(home).not.toMatch(/MapboxMap|GoogleMap|mapbox-gl/);
    expect(hero).toMatch(/<video/);
    expect(hero).toMatch(/\bmuted\b/);
    expect(hero).toMatch(/playsInline/);
    expect(hero).toMatch(/prefers-reduced-motion:\s*reduce/);
    expect(hero).not.toMatch(/autoPlay/);
  });

  it("does not autoplay uncontrolled media on marketing pages", () => {
    const pages = [
      "src/app/about/page.tsx",
      "src/app/how-to-charge/page.tsx",
      "src/app/pricing/page.tsx",
      "src/app/contact/page.tsx",
    ];
    for (const page of pages) {
      const source = read(page);
      expect(source).not.toMatch(/<video/i);
      expect(source).not.toMatch(/autoPlay/);
    }
  });

  it("keeps 44px minimum targets and reduced-motion in the design system", () => {
    const css = read("src/app/globals.css");
    expect(css).toMatch(/--size-touch:\s*44px/);
    expect(css).toMatch(/prefers-reduced-motion:\s*reduce/);
  });
});

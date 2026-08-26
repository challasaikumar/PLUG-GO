import { describe, expect, it } from "vitest";
import {
  defaultFinderQuery,
  finderActiveFilterCount,
  finderShouldIndex,
  parseFinderQuery,
  serializeFinderQuery,
} from "./query";

describe("parseFinderQuery", () => {
  it("accepts an empty query", () => {
    const parsed = parseFinderQuery(new URLSearchParams());
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.query).toMatchObject(defaultFinderQuery());
    }
  });

  it("parses shareable search and filters", () => {
    const parsed = parseFinderQuery(
      new URLSearchParams(
        "q=bengaluru&connectorType=ccs2&minKw=60&availability=available&openNow=1&sort=power&page=2",
      ),
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.query.q).toBe("bengaluru");
    expect(parsed.query.connectorType).toBe("ccs2");
    expect(parsed.query.minKw).toBe(60);
    expect(parsed.query.availability).toBe("available");
    expect(parsed.query.openNow).toBe(true);
    expect(parsed.query.sort).toBe("power");
    expect(parsed.query.page).toBe(2);
    expect(finderActiveFilterCount(parsed.query)).toBeGreaterThan(0);
  });

  it("rejects unknown filters instead of ignoring them silently", () => {
    const parsed = parseFinderQuery(new URLSearchParams("connectorType=usb-c&minKw=-1&availability=free"));
    expect(parsed.ok).toBe(false);
    if (parsed.ok) return;
    expect(parsed.errors.connectorType).toBeTruthy();
    expect(parsed.errors.minKw).toBeTruthy();
    expect(parsed.errors.availability).toBeTruthy();
  });

  it("requires lat and lng together and validates bounds", () => {
    const half = parseFinderQuery(new URLSearchParams("lat=12.97"));
    expect(half.ok).toBe(false);

    const ok = parseFinderQuery(new URLSearchParams("lat=12.97&lng=77.59"));
    expect(ok.ok).toBe(true);

    const bounds = parseFinderQuery(new URLSearchParams("north=13&south=12&east=78&west=77"));
    expect(bounds.ok).toBe(true);
  });

  it("does not serialize precise location into shareable params", () => {
    const parsed = parseFinderQuery(new URLSearchParams("q=pune&lat=18.5&lng=73.8&sort=nearest"));
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const serialized = serializeFinderQuery(parsed.query);
    expect(serialized.get("lat")).toBeNull();
    expect(serialized.get("lng")).toBeNull();
    expect(serialized.get("q")).toBe("pune");
    expect(serialized.get("sort")).toBe("nearest");
  });

  it("indexes only the clean finder URL", () => {
    expect(finderShouldIndex(defaultFinderQuery())).toBe(true);
    const withSearch = parseFinderQuery(new URLSearchParams("q=chennai"));
    expect(withSearch.ok && finderShouldIndex(withSearch.query)).toBe(false);
  });
});

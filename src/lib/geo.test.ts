import { describe, expect, it } from "vitest";
import {
  appleMapsDirectionsUrl,
  googleMapsDirectionsUrl,
  haversineKm,
  isCanonicalStationPath,
  isValidStationRouteParam,
  pathSegment,
  stationCanonicalPath,
} from "./geo";

describe("station URLs and directions", () => {
  it("builds a canonical state/city/slug path", () => {
    const station = { state: "Tamil Nadu", city: "Chennai", slug: "omr-hub" };
    expect(pathSegment(station.state)).toBe("tamil-nadu");
    expect(stationCanonicalPath(station)).toBe("/stations/tamil-nadu/chennai/omr-hub");
    expect(
      isCanonicalStationPath({ state: "tamil-nadu", city: "chennai", slug: "omr-hub" }, station),
    ).toBe(true);
    expect(
      isCanonicalStationPath({ state: "karnataka", city: "chennai", slug: "omr-hub" }, station),
    ).toBe(false);
  });

  it("rejects unsafe route params", () => {
    expect(isValidStationRouteParam("omr-hub")).toBe(true);
    expect(isValidStationRouteParam("../secret")).toBe(false);
    expect(isValidStationRouteParam("")).toBe(false);
  });

  it("builds maps links from real coordinates", () => {
    expect(googleMapsDirectionsUrl(13.0827, 80.2707)).toContain("13.0827%2C80.2707");
    expect(appleMapsDirectionsUrl(13.0827, 80.2707)).toContain("13.0827%2C80.2707");
  });

  it("computes a finite haversine distance", () => {
    const km = haversineKm(12.9716, 77.5946, 13.0827, 80.2707);
    expect(km).toBeGreaterThan(250);
    expect(km).toBeLessThan(400);
  });
});

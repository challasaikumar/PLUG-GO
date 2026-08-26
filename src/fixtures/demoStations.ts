/**
 * DEMO DATA — not live Plug and Go inventory.
 * For the internal design-system preview only.
 * Do not treat these rows as published stations, prices, or coverage.
 */

import type { PublicStatus } from "@/lib/status";

export const DEMO_DATA_NOTICE =
  "Demo data for design-system preview only. Not live Plug and Go stations, prices, or availability.";

export type DemoConnector = {
  type: string;
  maxKw: number;
  installedCount?: number;
};

export type DemoStation = {
  id: string;
  name: string;
  locality: string;
  status: PublicStatus;
  lastUpdatedLabel: string;
  connectors: DemoConnector[];
  priceLabel: string | null;
  accessSummary: string;
  photoLabel: string | null;
};

export const demoStations: DemoStation[] = [
  {
    id: "DEMO-STN-001",
    name: "Specimen bay — available (demo)",
    locality: "Example locality",
    status: "available",
    lastUpdatedLabel: "Last updated 2 min ago",
    connectors: [{ type: "CCS2", maxKw: 60, installedCount: 2 }],
    priceLabel: "₹12/kWh",
    accessSummary: "Public · hours unpublished",
    photoLabel: "Photo not published",
  },
  {
    id: "DEMO-STN-002",
    name: "Specimen bay — in use (demo)",
    locality: "Example locality",
    status: "in_use",
    lastUpdatedLabel: "Last updated 2 min ago",
    connectors: [{ type: "CCS2", maxKw: 60 }],
    priceLabel: "₹12/kWh",
    accessSummary: "Restricted access",
    photoLabel: null,
  },
  {
    id: "DEMO-STN-003",
    name: "Specimen bay — faulted (demo)",
    locality: "Example locality",
    status: "faulted",
    lastUpdatedLabel: "Last updated 2 min ago",
    connectors: [{ type: "Type 2", maxKw: 22 }],
    priceLabel: null,
    accessSummary: "Public",
    photoLabel: "Photo not published",
  },
  {
    id: "DEMO-STN-004",
    name: "Specimen bay — offline (demo)",
    locality: "Example locality",
    status: "offline",
    lastUpdatedLabel: "Last updated 18 min ago",
    connectors: [{ type: "CCS2", maxKw: 60 }],
    priceLabel: "₹12/kWh",
    accessSummary: "Public",
    photoLabel: null,
  },
  {
    id: "DEMO-STN-005",
    name: "Specimen bay — unknown (demo)",
    locality: "Example locality",
    status: "unknown",
    lastUpdatedLabel: "Availability not live",
    connectors: [{ type: "CCS2", maxKw: 60 }],
    priceLabel: "Price not published",
    accessSummary: "Access unpublished",
    photoLabel: "Photo not published",
  },
  {
    id: "DEMO-STN-006",
    name: "Specimen bay — stale (demo)",
    locality: "Example locality",
    status: "stale",
    lastUpdatedLabel: "Stale — last updated 18 min ago",
    connectors: [
      { type: "CCS2", maxKw: 60 },
      { type: "Type 2", maxKw: 22 },
    ],
    priceLabel: "₹12/kWh",
    accessSummary: "Public",
    photoLabel: null,
  },
];

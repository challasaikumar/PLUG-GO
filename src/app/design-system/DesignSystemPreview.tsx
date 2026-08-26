"use client";

import { useState } from "react";
import { DEMO_DATA_NOTICE, demoStations } from "@/fixtures/demoStations";
import { Accordion } from "@/components/ui/Accordion";
import { Alert } from "@/components/ui/Alert";
import { ArrivalInstructionsCard } from "@/components/ui/ArrivalInstructionsCard";
import { AvailabilityChip } from "@/components/ui/AvailabilityChip";
import { Button } from "@/components/ui/Button";
import { ConnectorBadge } from "@/components/ui/ConnectorBadge";
import { DataFreshness } from "@/components/ui/DataFreshness";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorRetryPanel } from "@/components/ui/ErrorRetryPanel";
import { FilterChip } from "@/components/ui/FilterChip";
import { Modal } from "@/components/ui/Modal";
import { SearchField } from "@/components/ui/SearchField";
import { StationCardSkeleton } from "@/components/ui/Skeleton";
import { StationCard } from "@/components/ui/StationCard";
import { SupportEscalationCard } from "@/components/ui/SupportEscalationCard";
import { TextInput } from "@/components/ui/TextInput";
import { useToast } from "@/components/ui/Toast";
import type { PublicStatus } from "@/lib/status";

const STATUSES: PublicStatus[] = [
  "available",
  "in_use",
  "faulted",
  "offline",
  "unknown",
  "stale",
];

const COLOURS: Array<{ name: string; token: string }> = [
  { name: "Ink / road", token: "var(--color-ink-road)" },
  { name: "Canvas", token: "var(--color-surface-canvas)" },
  { name: "Paper", token: "var(--color-surface-default)" },
  { name: "Action", token: "var(--color-action-primary)" },
  { name: "Available", token: "var(--color-status-available)" },
  { name: "In use", token: "var(--color-status-limited)" },
  { name: "Faulted", token: "var(--color-status-faulted)" },
  { name: "Offline", token: "var(--color-status-offline)" },
  { name: "Focus", token: "var(--color-focus-ring)" },
];

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} style={{ marginBottom: 64 }}>
      <h2 className="type-h2" style={{ margin: "0 0 16px" }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function DesignSystemPreview() {
  const { push } = useToast();
  const [query, setQuery] = useState("");
  const [ccs, setCcs] = useState(true);
  const [type2, setType2] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="container-png" style={{ padding: "32px 0 96px" }}>
      <p className="demo-banner" style={{ margin: "0 0 24px" }}>
        {DEMO_DATA_NOTICE}
      </p>
      <p className="type-caption" style={{ color: "var(--color-action-primary)", margin: "0 0 8px" }}>
        Internal · noindex
      </p>
      <h1 className="type-h1" style={{ margin: "0 0 8px" }}>
        Plug and Go design system
      </h1>
      <p className="type-body" style={{ maxWidth: "40rem", color: "var(--color-text-secondary)" }}>
        Specimen for tokens and components. Status always uses icon, label, and colour. Stale and unknown are never shown as Available.
      </p>

      <nav aria-label="Specimen sections" style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "24px 0 48px" }}>
        {[
          ["type", "Typography"],
          ["colour", "Colour"],
          ["buttons", "Buttons"],
          ["forms", "Forms"],
          ["stations", "Stations"],
          ["states", "States"],
          ["overlay", "Overlays"],
        ].map(([href, label]) => (
          <a key={href} href={`#${href}`} className="filter-chip" style={{ textDecoration: "none" }}>
            {label}
          </a>
        ))}
      </nav>

      <Section id="type" title="Typography">
        <p className="type-display">Display · system UI</p>
        <p className="type-h1">Heading 1</p>
        <p className="type-h2">Heading 2</p>
        <p className="type-h3">Heading 3</p>
        <p className="type-body-lg">Lead body. Minimum body size is 16px.</p>
        <p className="type-body">
          Body copy uses sentence case, local units, and honest timestamps. Technical values use IBM Plex Mono.
        </p>
        <p className="font-mono type-body">₹12/kWh · CCS2 · 60 kW · DEMO-STN-001</p>
        <p className="type-small">Small · Last updated 2 min ago</p>
        <p className="type-caption">Caption</p>
      </Section>

      <Section id="colour" title="Colour and status">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {COLOURS.map((item) => (
            <div key={item.name} className="paper-card" style={{ overflow: "hidden" }}>
              <div style={{ height: 56, background: item.token }} />
              <p className="type-small" style={{ margin: 8 }}>
                {item.name}
              </p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {STATUSES.map((status) => (
            <AvailabilityChip key={status} status={status} />
          ))}
        </div>
        <DataFreshness label="Last updated 2 min ago" status="available" />
        <DataFreshness label="Stale — last updated 18 min ago" status="stale" />
      </Section>

      <Section id="buttons" title="Buttons and links">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button variant="outline" disabled>
            Disabled outline
          </Button>
        </div>
        <p>
          <a className="png-link" href="#forms">
            Get directions
          </a>
        </p>
      </Section>

      <Section id="forms" title="Search and filters">
        <div style={{ maxWidth: 480, display: "grid", gap: 24 }}>
          <SearchField
            value={query}
            onChange={setQuery}
            suggestions={
              query
                ? [{ id: "demo-place", label: "Demo place (not a live city)" }]
                : []
            }
            onSubmit={() => push("Search is a specimen control only.", "info")}
          />
          <SearchField value="" onChange={() => undefined} loading />
          <SearchField
            value="zzz"
            onChange={() => undefined}
            error="We could not search. Try a city name."
            onRetry={() => push("Retry is a specimen action.", "info")}
          />
          <SearchField value="zzz" onChange={() => undefined} empty />
          <SearchField value="" onChange={() => undefined} offline />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <FilterChip label="CCS2" pressed={ccs} onPressedChange={setCcs} showClear />
            <FilterChip label="Type 2" pressed={type2} onPressedChange={setType2} />
          </div>
          <TextInput label="Name" name="specimen-name" placeholder="Optional" />
          <TextInput
            label="Phone"
            name="specimen-phone"
            error="Enter a valid mobile number."
            defaultValue=""
          />
          <TextInput label="Disabled" name="specimen-off" disabled value="Not editable" />
        </div>
      </Section>

      <Section id="stations" title="Station cards and badges">
        <p className="type-small" style={{ color: "var(--color-text-secondary)", marginTop: 0 }}>
          Cards use a paper border, not a floating shadow. Prices and names below are specimen labels only.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {demoStations.map((station) => (
            <StationCard key={station.id} station={station} primaryHref="/design-system#stations" />
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          <ConnectorBadge type="CCS2" maxKw={60} installedCount={2} />
          <ConnectorBadge type="Type 2" maxKw={22} />
          <ConnectorBadge type="CCS2" maxKw={60} planned />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
            marginTop: 24,
          }}
        >
          <ArrivalInstructionsCard
            address="Address unpublished — specimen only"
            steps={["Enter from the marked gate", "Bays are on the right after the canopy"]}
          />
          <SupportEscalationCard stationId="DEMO-STN-001" />
        </div>
      </Section>

      <Section id="states" title="Loading, empty, error, offline">
        <div style={{ display: "grid", gap: 16, maxWidth: 560 }}>
          <StationCardSkeleton />
          <EmptyState
            title="No published stations match this search"
            body="Do not invent nearby sites. Clear filters or contact support."
            action={{ href: "/contact", label: "Contact us" }}
            secondaryAction={{ href: "/find-charger", label: "Clear and go back", variant: "outline" }}
          />
          <ErrorRetryPanel onRetry={() => push("Retry clicked (specimen).", "info")} />
          <ErrorRetryPanel offline onRetry={() => push("Still offline in this specimen.", "error")} />
          <Alert variant="info" title="Availability not live">
            Until CSMS data exists, public status must stay Unknown or Stale — never Available.
          </Alert>
          <Alert variant="warning" title="Stale">
            Last updated 18 min ago. Do not treat this as Available.
          </Alert>
          <Alert variant="error" title="Faulted">
            Do not use this connector.
          </Alert>
          <Alert variant="success">We’ll use this email to reply. No SLA is published.</Alert>
        </div>
        <div style={{ marginTop: 24 }}>
          <Accordion
            items={[
              {
                id: "faq-1",
                question: "Why is status unknown?",
                answer: "There is no trusted live event yet. Unknown is not Available.",
              },
              {
                id: "faq-2",
                question: "Are these real Plug and Go prices?",
                answer: "No. ₹12/kWh is a format specimen on this internal page only.",
              },
            ]}
          />
        </div>
      </Section>

      <Section id="overlay" title="Modal and bottom sheet">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Button onClick={() => setModalOpen(true)}>Open modal</Button>
          <Button variant="outline" onClick={() => setSheetOpen(true)}>
            Open bottom sheet
          </Button>
          <Button variant="secondary" onClick={() => push("Saved (specimen toast).", "success")}>
            Show toast
          </Button>
        </div>
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Filters" variant="modal">
          <p className="type-body" style={{ marginTop: 0 }}>
            Desktop dialog. Esc, overlay click, and Close all dismiss it. Focus returns to the opener.
          </p>
          <Button onClick={() => setModalOpen(false)}>Apply</Button>
        </Modal>
        <Modal open={sheetOpen} onClose={() => setSheetOpen(false)} title="Filters" variant="sheet">
          <p className="type-body" style={{ marginTop: 0 }}>
            Mobile-style bottom sheet. Use this pattern for filters on small screens.
          </p>
          <Button onClick={() => setSheetOpen(false)} block>
            Apply
          </Button>
        </Modal>
      </Section>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { FieldRequired } from "@/components/ui/FieldRequired";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import {
  EDUCATIONAL_EXAMPLE_LABEL,
  educationalEstimate,
  parseCalculatorInput,
} from "@/lib/tariff/calculator";
import { FIELD_LIMITS, validateOptionalSlug } from "@/lib/fields";
import { formatInrFromPaise } from "@/lib/tariff/format";
import type { TariffEstimate } from "@/lib/tariff/estimate";

type StationLookup =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "missing"; message: string }
  | { status: "ok"; estimate: TariffEstimate; stationName: string };

function nudge(raw: string, delta: number, min: number, max: number, decimals: number): string {
  const current = Number(raw);
  const base = Number.isFinite(current) ? current : min;
  const factor = 10 ** decimals;
  const next = Math.min(max, Math.max(min, Math.round((base + delta) * factor) / factor));
  return decimals === 0 ? String(next) : String(next);
}

type MeterProps = {
  id: string;
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  decimals: number;
  inputMode: "decimal" | "numeric";
  help: string;
  error?: string;
  onChange: (value: string) => void;
};

function Meter({ id, label, value, min, max, step, decimals, inputMode, help, error, onChange }: MeterProps) {
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;

  return (
    <div className="meter">
      <label className="meter__label" htmlFor={id}>
        {label}
        <FieldRequired />
      </label>
      <div className="meter__face">
        <button
          type="button"
          className="meter__nudge"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(nudge(value, -step, min, max, decimals))}
        >
          −
        </button>
        <input
          id={id}
          name={id}
          type="number"
          required
          inputMode={inputMode}
          min={min}
          max={max}
          step={decimals === 0 ? 1 : step}
          value={value}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${helpId} ${errorId}` : helpId}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          className="meter__nudge"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(nudge(value, step, min, max, decimals))}
        >
          +
        </button>
      </div>
      <p id={helpId} className="meter__help">
        {help}
      </p>
      {error ? (
        <p id={errorId} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function EstimateTicket({
  stamp,
  title,
  estimate,
  totalLabel,
}: {
  stamp: string;
  title: string;
  estimate: TariffEstimate;
  totalLabel: string;
}) {
  return (
    <div className="ticket-print">
      <p className="ticket-print__stamp">{stamp}</p>
      <h3>{title}</h3>
      <table>
        <caption className="visually-hidden">{title}</caption>
        <tbody>
          {estimate.lines.map((line) => (
            <tr key={`${line.code}-${line.label}`}>
              <th scope="row">{line.label}</th>
              <td className="font-mono">{formatInrFromPaise(line.amountPaise)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">{totalLabel}</th>
            <td className="font-mono">{formatInrFromPaise(estimate.totalPaise)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function PricingCalculator() {
  const [energyKwh, setEnergyKwh] = useState("10");
  const [idleMinutes, setIdleMinutes] = useState("10");
  const [parkingMinutes, setParkingMinutes] = useState("5");
  const [stationSlug, setStationSlug] = useState("");
  const [slugError, setSlugError] = useState<string | undefined>();
  const [stationLookup, setStationLookup] = useState<StationLookup>({ status: "idle" });
  const parsed = useMemo(
    () => parseCalculatorInput({ energyKwh, idleMinutes, parkingMinutes }),
    [energyKwh, idleMinutes, parkingMinutes],
  );
  const example = parsed.ok ? educationalEstimate(parsed.value) : null;

  async function lookupStation(event: React.FormEvent) {
    event.preventDefault();
    const slugIssue = validateOptionalSlug(stationSlug);
    if (slugIssue) {
      setSlugError(slugIssue);
      setStationLookup({ status: "idle" });
      return;
    }
    const slug = stationSlug.trim().toLowerCase();
    if (!slug) {
      setSlugError("Enter a published station slug to try an approved tariff.");
      setStationLookup({ status: "missing", message: "Enter a published station slug to try an approved tariff." });
      return;
    }
    setSlugError(undefined);
    if (!parsed.ok) {
      setStationLookup({ status: "missing", message: "Correct the energy and time fields first." });
      return;
    }
    setStationLookup({ status: "loading" });
    const params = new URLSearchParams({
      energyKwhMilli: String(Math.round(parsed.value.energyKwh * 1000)),
      idleMinutes: String(parsed.value.idleMinutes),
      parkingMinutes: String(parsed.value.parkingMinutes),
    });
    const response = await fetch(`/api/public/stations/${encodeURIComponent(slug)}/tariff-estimate?${params}`);
    const data = (await response.json()) as {
      ok?: boolean;
      error?: string;
      estimate?: TariffEstimate;
    };
    if (!response.ok || !data.ok || !data.estimate) {
      setStationLookup({
        status: "missing",
        message:
          data.error ||
          "No approved Plug and Go tariff applies to that station. No rupee estimate is shown for it.",
      });
      return;
    }
    setStationLookup({
      status: "ok",
      estimate: data.estimate,
      stationName: slug,
    });
  }

  return (
    <section className="calc-workshop" aria-labelledby="calc-heading">
      <header className="calc-workshop__intro">
        <h2 id="calc-heading">Educational estimate calculator</h2>
        <p>
          This tool shows how energy, service, parking, idle, GST, and discounts can add up. It is not an exact cost,
          not a quote, and not a tax invoice. Final invoices, when payments exist, can differ.
        </p>
      </header>

      <div className="calc-workshop__body">
        <form className="calc-workshop__controls" onSubmit={lookupStation} noValidate>
          <div className="meter-row">
            <Meter
              id="calc-energy"
              label="Energy to add (kWh)"
              value={energyKwh}
              min={0.1}
              max={200}
              step={1}
              decimals={1}
              inputMode="decimal"
              help="Example session size, 0.1 to 200 kWh."
              error={!parsed.ok ? parsed.errors.energyKwh : undefined}
              onChange={setEnergyKwh}
            />
            <Meter
              id="calc-idle"
              label="Idle minutes after charging"
              value={idleMinutes}
              min={0}
              max={480}
              step={1}
              decimals={0}
              inputMode="numeric"
              help="Whole minutes, 0 to 480. Example idle grace is 10 minutes."
              error={!parsed.ok ? parsed.errors.idleMinutes : undefined}
              onChange={setIdleMinutes}
            />
            <Meter
              id="calc-parking"
              label="Parking minutes"
              value={parkingMinutes}
              min={0}
              max={480}
              step={1}
              decimals={0}
              inputMode="numeric"
              help="Whole minutes, 0 to 480. Only used if a parking rate applies."
              error={!parsed.ok ? parsed.errors.parkingMinutes : undefined}
              onChange={setParkingMinutes}
            />
          </div>

          <div className="calc-lookup">
            <label className="field-label" htmlFor="calc-slug">
              Optional published station slug
            </label>
            <div className="calc-lookup__row">
              <div className={`field-control${slugError ? " field-control--error" : ""}`}>
                <input
                  id="calc-slug"
                  name="stationSlug"
                  value={stationSlug}
                  maxLength={FIELD_LIMITS.slug}
                  autoComplete="off"
                  spellCheck={false}
                  aria-invalid={slugError ? true : undefined}
                  aria-describedby={slugError ? "calc-slug-error" : "calc-slug-help"}
                  onChange={(event) => {
                    setStationSlug(event.target.value);
                    if (slugError) setSlugError(undefined);
                  }}
                  onBlur={() => setSlugError(validateOptionalSlug(stationSlug))}
                />
              </div>
              <Button type="submit" variant="outline" loading={stationLookup.status === "loading"}>
                Look up approved tariff
              </Button>
            </div>
            {slugError ? (
              <p id="calc-slug-error" className="field-error" role="alert">
                {slugError}
              </p>
            ) : (
              <p id="calc-slug-help" className="field-help">
                If an approved tariff exists for that station, a Plug and Go estimate appears. If none applies, no real
                rupee estimate is shown. Use lowercase letters, numbers, and hyphens only.
              </p>
            )}
          </div>
        </form>

        <div className="calc-workshop__print">
          <Alert variant="info" title="Hypothetical example values">
            {EDUCATIONAL_EXAMPLE_LABEL} The rupee figure below uses labelled example rates, not a live Plug and Go
            tariff.
          </Alert>

          {example ? (
            <EstimateTicket
              stamp="Education only — not a quote"
              title="Educational example estimate"
              estimate={example}
              totalLabel="Example estimated total"
            />
          ) : (
            <Alert variant="warning" title="Example total hidden">
              Correct the fields above to see an educational example. No rupee total is shown while the inputs are
              invalid.
            </Alert>
          )}

          {stationLookup.status === "missing" ? (
            <Alert variant="warning" title="No Plug and Go rupee estimate">
              {stationLookup.message}
            </Alert>
          ) : null}

          {stationLookup.status === "ok" ? (
            <>
              <EstimateTicket
                stamp="Approved tariff — still an estimate"
                title={`Approved tariff estimate for ${stationLookup.stationName}`}
                estimate={stationLookup.estimate}
                totalLabel="Estimated total"
              />
              <Alert variant="info" title="Estimate, not invoice">
                {stationLookup.estimate.disclaimer}
              </Alert>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}

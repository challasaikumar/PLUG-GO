import type { AccordionItem } from "@/components/ui/Accordion";
import { accessTypeLabel, connectorTypeLabel } from "@/lib/catalogue/labels";
import type { PublicStation } from "@/lib/catalogue/station-service";
import { formatPaisePerKwh } from "@/lib/tariff/format";

export function stationFaqs(station: PublicStation): AccordionItem[] {
  const connectorSummary = Array.from(
    new Map(
      station.connectors.map((connector) => [
        `${connector.connectorType}-${connector.maxKw}`,
        `${connectorTypeLabel(connector.connectorType)} · ${connector.maxKw} kW`,
      ]),
    ).values(),
  ).join("; ");

  const items: AccordionItem[] = [];

  if (connectorSummary) {
    items.push({
      id: "connectors",
      question: "Which connectors are installed here?",
      answer: `${connectorSummary}. Installed connectors: ${station.installedConnectorCount}. Currently available (fresh Available only): ${station.availableConnectorCount}.`,
    });
  }

  items.push({
    id: "access",
    question: "When can I use this station?",
    answer: `${accessTypeLabel(station.access.type)}. ${station.access.hoursSummary}${
      station.access.is24_7 === true ? " Recorded as open 24/7." : ""
    }${station.access.restrictions ? ` Restrictions: ${station.access.restrictions}` : ""}`,
  });

  if (station.tariff) {
    items.push({
      id: "price",
      question: "What will charging cost?",
      answer: `An approved tariff is published from ${new Date(station.tariff.effectiveFrom).toLocaleDateString("en-IN")}. Energy starts at ${formatPaisePerKwh(station.tariff.energyPaisePerKwh)}. The on-page estimate is not a tax invoice.`,
    });
  } else {
    items.push({
      id: "price",
      question: "What will charging cost?",
      answer: "Price is not published for this station. No approved tariff is in effect, so no rupee rate is shown.",
    });
  }

  if (station.access.bookingRequired === true) {
    items.push({
      id: "booking",
      question: "Do I need to book?",
      answer:
        "This site records that booking may be required on arrival. A website reservation is offered only when an approved, currently effective booking policy names eligible connectors and payment is configured. This website never starts a charging session.",
    });
  }

  if (station.compatibleVehicleNotes?.trim()) {
    items.push({
      id: "vehicles",
      question: "Which vehicles are compatible?",
      answer: station.compatibleVehicleNotes.trim(),
    });
  }

  return items;
}

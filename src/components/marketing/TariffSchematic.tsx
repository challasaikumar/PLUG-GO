import {
  IconBolt,
  IconBookmark,
  IconParking,
  IconPercent,
  IconSupport,
  IconTag,
} from "@/components/ui/icons";

export function TariffSchematic() {
  const rows = [
    { label: "Energy charge", Icon: IconBolt },
    { label: "Service charge", Icon: IconSupport },
    { label: "Parking / idle / reservation fee", Icon: IconParking },
    { label: "GST", Icon: IconPercent },
    { label: "Discount", Icon: IconTag },
  ];

  return (
    <div className="tariff-schematic" aria-label="Tariff breakdown without rupee amounts">
      <p className="tariff-schematic__kicker">Format only — rates not published</p>
      <ol className="tariff-list">
        {rows.map((row) => (
          <li key={row.label}>
            <span className="price-mark price-mark--on-dark" aria-hidden="true">
              <row.Icon />
            </span>
            <span>{row.label}</span>
            <span className="font-mono tariff-placeholder">₹ —</span>
          </li>
        ))}
      </ol>
      <p className="tariff-total">
        <span>Payable (estimate later)</span>
        <span className="font-mono">Price not published</span>
      </p>
      <p className="tariff-schematic__note">
        Effective date will sit next to a live tariff. No date is shown until finance approves a version.
      </p>
    </div>
  );
}

import { voltran } from "@/content/voltran";

export function ChargerPowerStrip({ className }: { className?: string }) {
  return (
    <ul className={["vt-kw", className].filter(Boolean).join(" ")} aria-label="Fast charger power">
      {voltran.chargers.levels.map((kw) => (
        <li key={kw}>
          <p className="vt-kw__label">{voltran.chargers.label}</p>
          <p className="vt-kw__value">
            {kw} <span>kW</span>
          </p>
        </li>
      ))}
    </ul>
  );
}

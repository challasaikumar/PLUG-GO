import { VehiclesManager } from "@/components/account/VehiclesManager";
import { listDriverVehicles } from "@/lib/account/vehicles";
import { requireDriverPage } from "@/lib/auth/driver";
import { pageMeta } from "@/lib/metadata";

export const metadata = pageMeta({
  title: "Vehicles",
  description: "Saved vehicles for your Plug and Go account.",
  path: "/vehicles",
  index: false,
});

export default async function VehiclesPage() {
  const driver = await requireDriverPage("/vehicles");
  const vehicles = await listDriverVehicles(driver.id);

  return (
    <div className="container-png" style={{ padding: "48px 0 80px", maxWidth: 720 }}>
      <h1 className="type-h1" style={{ margin: "0 0 8px" }}>
        Vehicles
      </h1>
      <p className="type-body" style={{ margin: "0 0 24px", color: "var(--color-text-secondary)" }}>
        Only you can see these records. Connector preference can pre-fill finder filters later; it will not hide other
        published stations unless you apply that filter yourself.
      </p>
      <VehiclesManager
        initialVehicles={vehicles.map((vehicle) => ({
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          connectorType: vehicle.connectorType,
          batteryKwh: vehicle.batteryKwh,
          nickname: vehicle.nickname,
        }))}
      />
    </div>
  );
}

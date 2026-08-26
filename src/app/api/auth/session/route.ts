import { jsonError, jsonOk } from "@/lib/api/http";
import { isDatabaseConfigured } from "@/lib/db/prisma";
import { maskE164 } from "@/lib/auth/phone";
import { requireDriverFromRequest, DriverAuthRequiredError } from "@/lib/auth/driver";
import { listDriverVehicles } from "@/lib/account/vehicles";
import { getPrisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isDatabaseConfigured()) {
    return jsonOk({ signedIn: false });
  }
  try {
    const driver = await requireDriverFromRequest(request);
    const prisma = getPrisma();
    const [vehicleCount, savedCount] = await Promise.all([
      prisma.driverVehicle.count({ where: { driverId: driver.id } }),
      prisma.savedStation.count({ where: { driverId: driver.id } }),
    ]);
    const vehicles = await listDriverVehicles(driver.id);
    const response = jsonOk({
      signedIn: true,
      phoneMasked: maskE164(driver.phoneE164),
      vehicleCount,
      savedStationCount: savedCount,
      preferredConnectorType: vehicles.at(-1)?.connectorType ?? null,
    });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    if (error instanceof DriverAuthRequiredError) {
      const response = jsonOk({ signedIn: false });
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }
    return jsonError(500, "internal_error", "The session could not be read.");
  }
}

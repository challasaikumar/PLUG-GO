import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const demoStations = await prisma.station.findMany({ where: { isDemo: true }, select: { id: true } });
  const ids = demoStations.map((row) => row.id);
  if (ids.length) {
    await prisma.staffAuditEvent.deleteMany({
      where: { targetType: "station", targetId: { in: ids } },
    });
  }
  await prisma.station.deleteMany({ where: { isDemo: true } });
  await prisma.host.deleteMany({ where: { isDemo: true } });
  await prisma.organisation.deleteMany({ where: { isDemo: true } });
  console.log("Removed isDemo organisations, hosts, and stations.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

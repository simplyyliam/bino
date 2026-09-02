import { PrismaClient } from "@prisma/client";
import { LocationSystems } from "@bino/data";

const prisma = new PrismaClient();

async function main() {
  for (const system of LocationSystems) {
    await prisma.locationSystem.upsert({
      where: { id: system.id },
      update: {},
      create: {
        id: system.id,
        name: system.name,
        usesExistingCodes: system.usesExistingCodes,
        separator: system.separator,
        paddingWidth: system.paddingWidth,
        levels: system.levels as any,
        mappingRules: system.mappingRules as any,
        gridConfig: system.gridConfig as any,
      },
    });
  }
  console.log(`Seeded ${LocationSystems.length} default LocationSystems`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

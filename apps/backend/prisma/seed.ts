import { PrismaClient } from '@prisma/client';

// ── Seed — demo data for hackathon video ──────────────────────────────────────
// Run: pnpm prisma:seed
// Creates: 1 demo farm + 3 nodes (populated in Fase 4)

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // TODO Fase 4: Insert demo Farm + FarmNodes + 30 SensorReadings
  // Keeping empty for now — scaffold only
}

main()
  .catch((err: unknown) => {
    process.stderr.write(`Seed failed: ${String(err)}\n`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

// ── Seed — demo data for hackathon video ──────────────────────────────────────
// Run: pnpm prisma:seed
// Creates: 1 demo farm + 3 nodes + 30 sensor readings

const prisma = new PrismaClient();

function makeHash(fields: Record<string, unknown>): string {
  const payload = Object.values(fields).join('|');
  return createHash('sha256').update(payload).digest('hex');
}

async function main(): Promise<void> {
  // Clean up previous seed
  await prisma.sensorReading.deleteMany();
  await prisma.farmNode.deleteMany();
  await prisma.farm.deleteMany();

  // ── Farm ──────────────────────────────────────────────────────────────────
  const farm = await prisma.farm.create({
    data: {
      name: 'Finca El Progreso',
      location: 'Antioquia, Colombia',
      owner_pubkey: 'DEMO_OWNER_PUBKEY',
      farm_pubkey: null,
      is_active: true,
    },
  });

  // ── Nodes ─────────────────────────────────────────────────────────────────
  const nodeIds = ['GT-NODE-001', 'GT-NODE-002', 'GT-NODE-003'];
  for (const nodeId of nodeIds) {
    await prisma.farmNode.create({
      data: {
        node_id: nodeId,
        farm_id: farm.id,
        is_active: true,
        battery_mv: 4150,
        last_seen: new Date(),
      },
    });
  }

  // ── 30 Sensor Readings (demo — last 24h) ──────────────────────────────────
  const now = Date.now();
  const intervalMs = (24 * 60 * 60 * 1000) / 30; // spread over 24h

  for (let i = 0; i < 30; i++) {
    const nodeId = nodeIds[i % nodeIds.length] as string;
    const timestamp = now - (30 - i) * intervalMs;
    const temperature_c = 24.5 + (Math.random() - 0.5) * 4;
    const humidity_pct = 72 + (Math.random() - 0.5) * 20;
    const pressure_hpa = 1013 + (Math.random() - 0.5) * 10;
    const soil_moisture_pct = 55 + (Math.random() - 0.5) * 20;
    const light_lux = 18000 + (Math.random() - 0.5) * 5000;
    const co2_ppm = 650 + (Math.random() - 0.5) * 100;
    const battery_mv = 4200 - i;
    const rssi_dbm = -65 + Math.round((Math.random() - 0.5) * 10);
    const uptime_seconds = i * 8;

    const data_hash = makeHash({
      node_id: nodeId,
      farm_id: farm.id,
      sequence: i,
      temperature_c,
      humidity_pct,
      pressure_hpa,
      soil_moisture_pct,
      light_lux,
      co2_ppm,
      battery_mv,
      rssi_dbm,
      uptime_seconds,
      timestamp,
    });

    await prisma.sensorReading.create({
      data: {
        node_id: nodeId,
        farm_id: farm.id,
        sequence: i,
        temperature_c,
        humidity_pct,
        pressure_hpa,
        soil_moisture_pct,
        light_lux,
        co2_ppm,
        battery_mv,
        rssi_dbm,
        uptime_seconds,
        data_hash,
        status: i < 28 ? 'CONFIRMED' : 'PENDING',
        tx_signature: i < 28 ? `DEMO_TX_${i}_${'x'.repeat(40)}` : null,
        pda_address: i < 28 ? `DEMO_PDA_${i}_${'x'.repeat(40)}` : null,
        created_at: new Date(timestamp),
      },
    });
  }

  process.stdout.write(
    `✓ Seed complete: 1 farm, ${nodeIds.length} nodes, 30 readings\n`,
  );
}

main()
  .catch((err: unknown) => {
    process.stderr.write(`Seed failed: ${String(err)}\n`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

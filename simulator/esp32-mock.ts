import { createHash } from 'crypto';
import type { NodeReading } from '@groundtruth/types';

// ── ESP32 Simulator ────────────────────────────────────────────────────────────
// Mimics an ESP32 + BME280 + capacitive soil + BH1750 + MH-Z19 node
// Sends POST /api/hardware/ingest every SIMULATOR_INTERVAL_MS
//
// Required env vars:
//   SIMULATOR_API_URL       http://localhost:3001
//   SIMULATOR_MODE          demo | standard | low-power
//   SIMULATOR_INTERVAL_MS   8000 (demo) | 300000 (standard) | 900000 (low-power)
//   SIMULATOR_NODE_ID       GT-NODE-001
//   SIMULATOR_FARM_PUBKEY   <pubkey of FarmAccount on-chain>
//   SIMULATOR_READINGS_COUNT 0 = infinite

const API_URL = process.env['SIMULATOR_API_URL'] ?? 'http://localhost:3001';
const NODE_ID = process.env['SIMULATOR_NODE_ID'] ?? 'GT-NODE-001';
const FARM_PUBKEY = process.env['SIMULATOR_FARM_PUBKEY'] ?? 'FARM_PUBKEY_NOT_SET';
const INTERVAL_MS = parseInt(process.env['SIMULATOR_INTERVAL_MS'] ?? '8000', 10);
const MAX_READINGS = parseInt(process.env['SIMULATOR_READINGS_COUNT'] ?? '0', 10);
const MODE = process.env['SIMULATOR_MODE'] ?? 'demo';

// ── State (persists across readings — mimics real hardware) ───────────────────
let sequence = 0;
let battery_mv = 4200;
let uptime_seconds = 0;
let totalSent = 0;

// ── Sensor simulation helpers ─────────────────────────────────────────────────
function noise(value: number, range: number): number {
  return Math.round((value + (Math.random() - 0.5) * range) * 10) / 10;
}

function generateReading(): NodeReading {
  const timestamp = Date.now();

  const base: Omit<NodeReading, 'data_hash'> = {
    node_id: NODE_ID,
    farm_id: FARM_PUBKEY,
    sequence,
    temperature_c: noise(26.0, 4),      // 18–34°C typical tropical
    humidity_pct: noise(70.0, 20),       // 45–95%
    pressure_hpa: noise(1013.0, 5),      // 950–1050 hPa
    soil_moisture_pct: noise(60.0, 20),  // 0–100% — critical for EUDR
    light_lux: noise(20000, 5000),       // 0–65535 lux
    co2_ppm: noise(650, 80),             // 400–2000 ppm — DeSci value
    battery_mv,                          // decreasing -1mV/reading (LiPo curve)
    rssi_dbm: noise(-65, 6),             // -30 to -100 dBm
    uptime_seconds,
    timestamp,
  };

  // SHA-256 chain-of-custody — same algorithm as backend crypto/hash.ts
  const hashFields = [
    base.node_id,
    base.farm_id,
    base.sequence,
    base.temperature_c,
    base.humidity_pct,
    base.pressure_hpa,
    base.soil_moisture_pct,
    base.light_lux,
    base.co2_ppm,
    base.battery_mv,
    base.rssi_dbm,
    base.uptime_seconds,
    base.timestamp,
  ].map(String).join('|');

  const data_hash = createHash('sha256').update(hashFields).digest('hex');

  return { ...base, data_hash };
}

// ── Send reading ───────────────────────────────────────────────────────────────
async function sendReading(): Promise<void> {
  const reading = generateReading();

  try {
    const res = await fetch(`${API_URL}/api/hardware/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reading),
    });

    if (res.ok) {
      const body = await res.json() as Record<string, unknown>;
      process.stdout.write(
        `[${MODE.toUpperCase()}] #${sequence} ` +
        `temp=${reading.temperature_c}°C ` +
        `hum=${reading.humidity_pct}% ` +
        `bat=${battery_mv}mV ` +
        `tx=${String(body['tx_signature']).slice(0, 12)}...\n`,
      );
    } else {
      const err = await res.text();
      process.stderr.write(`[ERROR] ${res.status}: ${err}\n`);
    }
  } catch (err) {
    process.stderr.write(`[ERROR] fetch failed: ${String(err)}\n`);
  }

  // Advance hardware state
  sequence++;
  totalSent++;
  battery_mv = Math.max(3000, battery_mv - 1); // -1mV/reading — visible in demo
  uptime_seconds += Math.floor(INTERVAL_MS / 1000);
}

// ── Main loop ─────────────────────────────────────────────────────────────────
process.stdout.write(
  `\n🌱 GroundTruth ESP32 Simulator\n` +
  `   Mode: ${MODE} | Node: ${NODE_ID} | Interval: ${INTERVAL_MS}ms\n` +
  `   API: ${API_URL} | Farm: ${FARM_PUBKEY.slice(0, 12)}...\n\n`,
);

// Send first reading immediately
await sendReading();

const interval = setInterval(async () => {
  await sendReading();

  if (MAX_READINGS > 0 && totalSent >= MAX_READINGS) {
    process.stdout.write(`\n✓ Sent ${totalSent} readings. Done.\n`);
    clearInterval(interval);
  }
}, INTERVAL_MS);

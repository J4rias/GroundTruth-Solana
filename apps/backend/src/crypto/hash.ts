import { createHash } from 'crypto';
import type { NodeReading } from '@groundtruth/types';
import { AppError, ErrorCode } from '@groundtruth/types';

// Fields concatenated in this exact order — must match simulator/esp32-mock.ts
const HASH_FIELDS = [
  'node_id',
  'farm_id',
  'sequence',
  'temperature_c',
  'humidity_pct',
  'pressure_hpa',
  'soil_moisture_pct',
  'light_lux',
  'co2_ppm',
  'battery_mv',
  'rssi_dbm',
  'uptime_seconds',
  'timestamp',
] as const;

export function computeDataHash(reading: Omit<NodeReading, 'data_hash'>): string {
  const payload = HASH_FIELDS.map((f) => String(reading[f])).join('|');
  return createHash('sha256').update(payload).digest('hex');
}

export function verifyDataHash(reading: NodeReading): void {
  const expected = computeDataHash(reading);
  if (expected !== reading.data_hash) {
    throw new AppError(
      ErrorCode.HASH_MISMATCH,
      'Data hash mismatch — payload integrity check failed',
      422,
      { received: reading.data_hash, expected, node_id: reading.node_id },
    );
  }
}

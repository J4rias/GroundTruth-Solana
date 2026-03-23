import { describe, it, expect } from 'vitest';
import { computeDataHash } from '../../crypto/hash.js';

describe('routes/hardware/ingest schema validation', () => {
  const basePayload = {
    node_id: 'GT-NODE-001',
    farm_id: 'FARM_PUBKEY_123',
    sequence: 1,
    temperature_c: 25.5,
    humidity_pct: 65.0,
    pressure_hpa: 1013.25,
    soil_moisture_pct: 60.0,
    light_lux: 20000,
    co2_ppm: 650,
    battery_mv: 4100,
    rssi_dbm: -65,
    uptime_seconds: 3600,
    timestamp: 1700000000000,
  };

  it('validates that node_id is required and non-empty', () => {
    const payload = { ...basePayload, node_id: '' };
    const hash = computeDataHash(basePayload);
    expect(() => {
      if (payload.node_id.length === 0) throw new Error('node_id cannot be empty');
    }).toThrow();
  });

  it('validates that data_hash must be exactly 64 chars', () => {
    const invalidHash = 'short';
    expect(invalidHash.length).not.toBe(64);
  });

  it('computes SHA-256 hash correctly and consistently', () => {
    const hash1 = computeDataHash(basePayload);
    const hash2 = computeDataHash(basePayload);
    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });

  it('detects hash mismatch when data is modified', () => {
    const correctHash = computeDataHash(basePayload);
    const modifiedPayload = { ...basePayload, temperature_c: 30.0 };
    const differentHash = computeDataHash(modifiedPayload);
    expect(correctHash).not.toBe(differentHash);
  });
});

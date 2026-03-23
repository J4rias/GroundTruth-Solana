import { describe, it, expect } from 'vitest';
import { computeDataHash, verifyDataHash } from '../../crypto/hash.js';
import { AppError, ErrorCode } from '@groundtruth/types';

describe('crypto/hash', () => {
  const validReading = {
    node_id: 'GT-NODE-001',
    farm_id: 'FARM_PUBKEY_123',
    sequence: 42,
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

  describe('computeDataHash', () => {
    it('produces a 64-char hex SHA-256 hash', () => {
      const hash = computeDataHash(validReading);
      expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it('is deterministic (same input → same output)', () => {
      const hash1 = computeDataHash(validReading);
      const hash2 = computeDataHash(validReading);
      expect(hash1).toBe(hash2);
    });

    it('changes when any field changes', () => {
      const hash1 = computeDataHash(validReading);
      const modified = { ...validReading, temperature_c: 26.0 };
      const hash2 = computeDataHash(modified);
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyDataHash', () => {
    it('passes when data_hash matches computed hash', () => {
      const hash = computeDataHash(validReading);
      const readingWithHash = { ...validReading, data_hash: hash };
      expect(() => verifyDataHash(readingWithHash)).not.toThrow();
    });

    it('throws HASH_MISMATCH AppError when hash is invalid', () => {
      const readingWithBadHash = { ...validReading, data_hash: 'x'.repeat(64) };
      expect(() => verifyDataHash(readingWithBadHash)).toThrow(AppError);
      try {
        verifyDataHash(readingWithBadHash);
      } catch (err) {
        expect(err).toBeInstanceOf(AppError);
        expect((err as AppError).code).toBe(ErrorCode.HASH_MISMATCH);
        expect((err as AppError).statusCode).toBe(422);
      }
    });

    it('throws HASH_MISMATCH when data_hash field length is incorrect', () => {
      const readingWithShortHash = { ...validReading, data_hash: 'abc' };
      expect(() => verifyDataHash(readingWithShortHash)).toThrow(AppError);
    });
  });
});

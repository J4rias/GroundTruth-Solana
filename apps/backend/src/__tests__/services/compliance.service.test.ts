import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getComplianceScore } from '../../services/compliance.service.js';

describe('compliance.service', () => {
  const mockFastify = {
    prisma: {
      sensorReading: {
        findMany: vi.fn(),
      },
    },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getComplianceScore', () => {
    it('returns zero score when no confirmed readings exist', async () => {
      mockFastify.prisma.sensorReading.findMany.mockResolvedValue([]);

      const result = await getComplianceScore(mockFastify, 'FARM_1');

      expect(result.score).toBe(0);
      expect(result.level).toBe('NON_COMPLIANT');
      expect(result.total_readings).toBe(0);
    });

    it('returns 100 COMPLIANT when all readings are within EUDR thresholds', async () => {
      // EUDR thresholds: temp [10, 35]°C, humidity [20, 90]%
      const compliantReadings = Array(10)
        .fill(null)
        .map((_, i) => ({
          id: i,
          farm_id: 'FARM_1',
          temperature_c: 25.0,
          humidity_pct: 65.0,
          status: 'CONFIRMED' as const,
          created_at: new Date(),
        }));

      mockFastify.prisma.sensorReading.findMany.mockResolvedValue(compliantReadings);

      const result = await getComplianceScore(mockFastify, 'FARM_1');

      expect(result.score).toBe(100);
      expect(result.level).toBe('COMPLIANT');
      expect(result.total_readings).toBe(10);
      expect(result.compliant_readings).toBe(10);
    });

    it('returns 0 NON_COMPLIANT when all readings are outside EUDR thresholds', async () => {
      const nonCompliantReadings = Array(5)
        .fill(null)
        .map((_, i) => ({
          id: i,
          farm_id: 'FARM_1',
          temperature_c: 5.0, // below 10°C min
          humidity_pct: 65.0,
          status: 'CONFIRMED' as const,
          created_at: new Date(),
        }));

      mockFastify.prisma.sensorReading.findMany.mockResolvedValue(nonCompliantReadings);

      const result = await getComplianceScore(mockFastify, 'FARM_1');

      expect(result.score).toBe(0);
      expect(result.level).toBe('NON_COMPLIANT');
      expect(result.total_readings).toBe(5);
    });

    it('returns WARNING level when 50% of readings are compliant', async () => {
      const mixedReadings = [
        { id: 1, farm_id: 'FARM_1', temperature_c: 25.0, humidity_pct: 65.0, status: 'CONFIRMED' as const, created_at: new Date() },
        { id: 2, farm_id: 'FARM_1', temperature_c: 25.0, humidity_pct: 65.0, status: 'CONFIRMED' as const, created_at: new Date() },
        { id: 3, farm_id: 'FARM_1', temperature_c: 5.0, humidity_pct: 65.0, status: 'CONFIRMED' as const, created_at: new Date() }, // non-compliant
        { id: 4, farm_id: 'FARM_1', temperature_c: 5.0, humidity_pct: 65.0, status: 'CONFIRMED' as const, created_at: new Date() }, // non-compliant
      ];

      mockFastify.prisma.sensorReading.findMany.mockResolvedValue(mixedReadings);

      const result = await getComplianceScore(mockFastify, 'FARM_1');

      expect(result.score).toBeGreaterThanOrEqual(40);
      expect(result.score).toBeLessThanOrEqual(50);
      expect(result.level).toBe('WARNING');
    });

    it('queries only CONFIRMED readings ordered descending by timestamp', async () => {
      mockFastify.prisma.sensorReading.findMany.mockResolvedValue([]);

      await getComplianceScore(mockFastify, 'FARM_1');

      expect(mockFastify.prisma.sensorReading.findMany).toHaveBeenCalledWith({
        where: {
          farm_id: 'FARM_1',
          status: 'CONFIRMED',
        },
        orderBy: { created_at: 'desc' },
        take: 100,
      });
    });

    it('includes temperature and humidity in parameters array', async () => {
      const readings = [
        { id: 1, farm_id: 'FARM_1', temperature_c: 24.0, humidity_pct: 60.0, status: 'CONFIRMED' as const, created_at: new Date() },
        { id: 2, farm_id: 'FARM_1', temperature_c: 26.0, humidity_pct: 70.0, status: 'CONFIRMED' as const, created_at: new Date() },
      ];

      mockFastify.prisma.sensorReading.findMany.mockResolvedValue(readings);

      const result = await getComplianceScore(mockFastify, 'FARM_1');

      expect(result.parameters).toBeDefined();
      expect(result.parameters.length).toBe(2);
      const tempParam = result.parameters.find((p) => p.name === 'Temperature');
      const humParam = result.parameters.find((p) => p.name === 'Humidity');

      expect(tempParam?.current_value).toBe(25.0); // (24 + 26) / 2
      expect(humParam?.current_value).toBe(65.0); // (60 + 70) / 2
    });
  });
});

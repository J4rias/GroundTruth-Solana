import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createReading, confirmReading, getReadings } from '../../services/reading.service.js';

describe('reading.service', () => {
  const mockFastify = {
    prisma: {
      sensorReading: {
        create: vi.fn(),
        update: vi.fn(),
        count: vi.fn(),
        findMany: vi.fn(),
      },
    },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createReading', () => {
    it('creates reading with PENDING status and Unix ms timestamp', async () => {
      const payload = {
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
        data_hash: 'abc'.repeat(21) + 'abcd', // 64 chars
      };

      const mockCreated = {
        id: '1',
        node_id: 'GT-NODE-001',
        farm_id: '1', // farm_id is stored as string
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
        data_hash: payload.data_hash,
        status: 'PENDING' as const,
        created_at: new Date(payload.timestamp),
        tx_signature: null,
        pda_address: null,
      };

      mockFastify.prisma.sensorReading.create.mockResolvedValue(mockCreated);

      const result = await createReading(mockFastify, payload, '1');

      expect(result.status).toBe('PENDING');
      expect(result.created_at.getTime()).toBe(payload.timestamp);
      expect(mockFastify.prisma.sensorReading.create).toHaveBeenCalled();
    });
  });

  describe('confirmReading', () => {
    it('updates status to CONFIRMED with tx_signature and pda_address', async () => {
      mockFastify.prisma.sensorReading.update.mockResolvedValue({ id: '1' });

      await confirmReading(mockFastify, '1', 'TX_SIGNATURE_123', 'PDA_ADDR_456');

      expect(mockFastify.prisma.sensorReading.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          status: 'CONFIRMED',
          tx_signature: 'TX_SIGNATURE_123',
          pda_address: 'PDA_ADDR_456',
        },
      });
    });
  });

  describe('getReadings', () => {
    it('returns paginated readings with correct skip/take', async () => {
      const mockReadings = [
        { id: 1, node_id: 'GT-NODE-001', temperature_c: 25.5 },
        { id: 2, node_id: 'GT-NODE-001', temperature_c: 26.0 },
      ];
      mockFastify.prisma.sensorReading.count.mockResolvedValue(100);
      mockFastify.prisma.sensorReading.findMany.mockResolvedValue(mockReadings);

      const result = await getReadings(mockFastify, 1, 2, 20);

      expect(result.data).toEqual(mockReadings);
      expect(result.total).toBe(100);
      expect(mockFastify.prisma.sensorReading.findMany).toHaveBeenCalledWith({
        where: { farm_id: 1 },
        orderBy: { created_at: 'desc' },
        skip: 20, // (2-1) * 20
        take: 20,
      });
    });

    it('calculates skip correctly for page 1', async () => {
      mockFastify.prisma.sensorReading.count.mockResolvedValue(50);
      mockFastify.prisma.sensorReading.findMany.mockResolvedValue([]);

      await getReadings(mockFastify, 1, 1, 10);

      expect(mockFastify.prisma.sensorReading.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );
    });
  });
});

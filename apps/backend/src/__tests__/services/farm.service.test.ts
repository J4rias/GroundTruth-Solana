import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getFarmById, getNodeByNodeId, updateNodeLastSeen } from '../../services/farm.service.js';
import { AppError, ErrorCode } from '@groundtruth/types';

describe('farm.service', () => {
  const mockFastify = {
    prisma: {
      farm: {
        findUnique: vi.fn(),
      },
      farmNode: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFarmById', () => {
    it('returns farm when found', async () => {
      const mockFarm = {
        id: '1',
        owner_pubkey: 'OWNER_PUB_KEY',
        farm_pubkey: 'FARM_PUB_KEY',
        name: 'Finca Test',
        location: 'Colombia',
        is_active: true,
        created_at: new Date(),
      };
      mockFastify.prisma.farm.findUnique.mockResolvedValue(mockFarm);

      const result = await getFarmById(mockFastify, '1');
      expect(result.name).toBe('Finca Test');
      expect(mockFastify.prisma.farm.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
    });

    it('throws FARM_NOT_FOUND when farm does not exist', async () => {
      mockFastify.prisma.farm.findUnique.mockResolvedValue(null);

      await expect(getFarmById(mockFastify, '999')).rejects.toThrow(AppError);
      try {
        await getFarmById(mockFastify, '999');
      } catch (err) {
        expect((err as AppError).code).toBe(ErrorCode.FARM_NOT_FOUND);
        expect((err as AppError).statusCode).toBe(404);
      }
    });
  });

  describe('getNodeByNodeId', () => {
    it('returns node when found and active', async () => {
      const mockNode = {
        id: 1,
        farm_id: 1,
        node_id: 'GT-NODE-001',
        is_active: true,
        battery_mv: 4100,
        last_seen: new Date(),
      };
      mockFastify.prisma.farmNode.findUnique.mockResolvedValue(mockNode);

      const result = await getNodeByNodeId(mockFastify, 'GT-NODE-001');
      expect(result).toEqual(mockNode);
    });

    it('throws NODE_INACTIVE when node is inactive', async () => {
      const mockNode = {
        id: 1,
        node_id: 'GT-NODE-001',
        is_active: false,
        battery_mv: 4100,
      };
      mockFastify.prisma.farmNode.findUnique.mockResolvedValue(mockNode);

      await expect(getNodeByNodeId(mockFastify, 'GT-NODE-001')).rejects.toThrow(AppError);
      try {
        await getNodeByNodeId(mockFastify, 'GT-NODE-001');
      } catch (err) {
        expect((err as AppError).code).toBe(ErrorCode.NODE_INACTIVE);
        expect((err as AppError).statusCode).toBe(403);
      }
    });

    it('throws NODE_NOT_FOUND when node does not exist', async () => {
      mockFastify.prisma.farmNode.findUnique.mockResolvedValue(null);

      await expect(getNodeByNodeId(mockFastify, 'INVALID')).rejects.toThrow(AppError);
    });
  });

  describe('updateNodeLastSeen', () => {
    it('updates battery_mv and last_seen timestamp', async () => {
      const beforeTime = Date.now();
      const mockUpdated = {
        id: 1,
        node_id: 'GT-NODE-001',
        battery_mv: 4099,
        last_seen: new Date(),
      };
      mockFastify.prisma.farmNode.update.mockResolvedValue(mockUpdated);

      await updateNodeLastSeen(mockFastify, 'GT-NODE-001', 4099);

      expect(mockFastify.prisma.farmNode.update).toHaveBeenCalledWith({
        where: { node_id: 'GT-NODE-001' },
        data: expect.objectContaining({
          battery_mv: 4099,
          last_seen: expect.any(Date),
        }),
      });

      const callData = mockFastify.prisma.farmNode.update.mock.calls[0][0].data;
      const lastSeenTime = callData.last_seen.getTime();
      expect(lastSeenTime).toBeGreaterThanOrEqual(beforeTime);
      expect(lastSeenTime).toBeLessThanOrEqual(Date.now());
    });
  });
});

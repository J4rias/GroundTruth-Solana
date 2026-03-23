import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimitByNodeId } from '../../middleware/rateLimiter.js';
import { AppError, ErrorCode } from '@groundtruth/types';

describe('middleware/rateLimiter', () => {
  const mockFastify = {
    redis: {
      pipeline: vi.fn(),
    },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows request when count is below limit (5 requests per 60s)', async () => {
    const mockPipeline = {
      zremrangebyscore: vi.fn().mockReturnThis(),
      zadd: vi.fn().mockReturnThis(),
      zcard: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([null, null, [null, 3], null]), // zcard returns [null, 3]
    };
    mockFastify.redis.pipeline.mockReturnValue(mockPipeline);

    await expect(rateLimitByNodeId(mockFastify, 'GT-NODE-001')).resolves.not.toThrow();
  });

  it('allows exactly 5 requests (the 5th request should succeed)', async () => {
    const mockPipeline = {
      zremrangebyscore: vi.fn().mockReturnThis(),
      zadd: vi.fn().mockReturnThis(),
      zcard: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([null, null, [null, 5], null]), // zcard returns [null, 5]
    };
    mockFastify.redis.pipeline.mockReturnValue(mockPipeline);

    await expect(rateLimitByNodeId(mockFastify, 'GT-NODE-001')).resolves.not.toThrow();
  });

  it('rejects 6th request (exceeds limit)', async () => {
    const mockPipeline = {
      zremrangebyscore: vi.fn().mockReturnThis(),
      zadd: vi.fn().mockReturnThis(),
      zcard: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([null, null, [null, 6], null]), // zcard returns [null, 6] > 5
    };
    mockFastify.redis.pipeline.mockReturnValue(mockPipeline);

    await expect(rateLimitByNodeId(mockFastify, 'GT-NODE-001')).rejects.toThrow(AppError);
  });

  it('throws REDIS_ERROR on pipeline exec failure', async () => {
    const mockPipeline = {
      zremrangebyscore: vi.fn().mockReturnThis(),
      zadd: vi.fn().mockReturnThis(),
      zcard: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockRejectedValue(new Error('Redis connection failed')),
    };
    mockFastify.redis.pipeline.mockReturnValue(mockPipeline);

    await expect(rateLimitByNodeId(mockFastify, 'GT-NODE-001')).rejects.toThrow(AppError);
  });

  it('uses correct Redis key format: rate:<nodeId>', async () => {
    const mockPipeline = {
      zremrangebyscore: vi.fn().mockReturnThis(),
      zadd: vi.fn().mockReturnThis(),
      zcard: vi.fn().mockReturnThis(),
      expire: vi.fn().mockReturnThis(),
      exec: vi.fn().mockResolvedValue([null, null, [null, 0], null]),
    };
    mockFastify.redis.pipeline.mockReturnValue(mockPipeline);

    await rateLimitByNodeId(mockFastify, 'GT-NODE-002');

    expect(mockPipeline.zremrangebyscore).toHaveBeenCalledWith('rate:GT-NODE-002', '-inf', expect.any(String));
    expect(mockPipeline.zadd).toHaveBeenCalledWith('rate:GT-NODE-002', expect.any(String), expect.any(String));
    expect(mockPipeline.zcard).toHaveBeenCalledWith('rate:GT-NODE-002');
    expect(mockPipeline.expire).toHaveBeenCalledWith('rate:GT-NODE-002', 60);
  });
});

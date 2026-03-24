import type { FastifyInstance } from 'fastify';
import { AppError, ErrorCode } from '@groundtruth/types';
import { logger } from '../config/logger.js';

// Sliding window: 30 requests per 60 seconds per node_id
const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 30;

export async function rateLimitByNodeId(
  fastify: FastifyInstance,
  nodeId: string,
): Promise<void> {
  const key = `rate:${nodeId}`;
  const now = Date.now();
  const windowStart = now - WINDOW_SECONDS * 1000;

  try {
    const pipe = fastify.redis.pipeline();
    pipe.zremrangebyscore(key, '-inf', windowStart.toString());
    pipe.zadd(key, now.toString(), now.toString());
    pipe.zcard(key);
    pipe.expire(key, WINDOW_SECONDS);

    const results = await pipe.exec();
    const count = results?.[2]?.[1] as number;

    if (count > MAX_REQUESTS) {
      logger.warn('Rate limit exceeded', { nodeId, count });
      throw new AppError(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        `Rate limit exceeded for node ${nodeId}. Max ${MAX_REQUESTS} req/${WINDOW_SECONDS}s.`,
        429,
        { nodeId, count, max: MAX_REQUESTS },
      );
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Redis rate limiter error', { err });
    throw new AppError(ErrorCode.REDIS_ERROR, 'Rate limiter unavailable', 500, { err });
  }
}

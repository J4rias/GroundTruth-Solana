import fp from 'fastify-plugin';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AppError, ErrorCode } from '@groundtruth/types';

declare module 'fastify' {
  interface FastifyInstance {
    redis: Redis;
  }
}

export const redisPlugin = fp(async (fastify) => {
  const redis = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
  });

  try {
    await redis.connect();
    logger.info('Redis connected');
  } catch (err) {
    throw new AppError(ErrorCode.REDIS_ERROR, 'Failed to connect to Redis', 500, { err });
  }

  fastify.decorate('redis', redis);

  fastify.addHook('onClose', async () => {
    await redis.quit();
    logger.info('Redis disconnected');
  });
});

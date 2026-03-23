import fp from 'fastify-plugin';
import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger.js';
import { AppError, ErrorCode } from '@groundtruth/types';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

export const prismaPlugin = fp(async (fastify) => {
  const prisma = new PrismaClient({ log: ['warn', 'error'] });

  try {
    await prisma.$connect();
    logger.info('Database connected');
  } catch (err) {
    throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to connect to database', 500, { err });
  }

  fastify.decorate('prisma', prisma);

  fastify.addHook('onClose', async () => {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  });
});

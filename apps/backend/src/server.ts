import Fastify, { type FastifyInstance } from 'fastify';
import { errorHandler } from './errors/handler.js';
import { logger } from './config/logger.js';
import { corsPlugin } from './plugins/cors.js';
import { redisPlugin } from './plugins/redis.js';
import { prismaPlugin } from './plugins/prisma.js';
import { ingestRoute } from './routes/hardware/ingest.js';
import { farmsRoute } from './routes/farms/index.js';
import { readingsRoute } from './routes/readings/index.js';
import { complianceRoute } from './routes/compliance/score.js';

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: false, // Winston handles all logging
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    disableRequestLogging: true,
  });

  // ── Global error handler ─────────────────────────────────────────────────
  server.setErrorHandler(errorHandler);

  // ── Request logging (Winston) ────────────────────────────────────────────
  server.addHook('onRequest', async (request) => {
    logger.debug('Incoming request', {
      requestId: request.id,
      method: request.method,
      url: request.url,
    });
  });

  server.addHook('onResponse', async (request, reply) => {
    logger.debug('Response sent', {
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
    });
  });

  // ── Plugins ──────────────────────────────────────────────────────────────
  await server.register(corsPlugin);
  await server.register(redisPlugin);
  await server.register(prismaPlugin);

  // ── Routes ───────────────────────────────────────────────────────────────
  await server.register(ingestRoute, { prefix: '/api/hardware' });
  await server.register(farmsRoute, { prefix: '/api/farms' });
  await server.register(readingsRoute, { prefix: '/api/readings' });
  await server.register(complianceRoute, { prefix: '/api/compliance' });

  // ── Health check ─────────────────────────────────────────────────────────
  server.get('/health', async () => ({
    status: 'ok',
    service: 'groundtruth-api',
    timestamp: new Date().toISOString(),
  }));

  return server;
}

import Fastify, { type FastifyInstance } from 'fastify';
import { errorHandler } from './errors/handler.js';
import { logger } from './config/logger.js';

// ── Build and configure the Fastify instance ──────────────────────────────────
// Plugins and routes are registered here (Fase 3).

export async function buildServer(): Promise<FastifyInstance> {
  const server = Fastify({
    logger: false, // Winston handles all logging
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    disableRequestLogging: true,
  });

  // ── Global error handler (Regla de oro #4) ──────────────────────────────
  server.setErrorHandler(errorHandler);

  // ── Request logging (Winston, not Fastify built-in) ─────────────────────
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

  // TODO Fase 3: server.register(corsPlugin)
  // TODO Fase 3: server.register(redisPlugin)
  // TODO Fase 3: server.register(prismaPlugin)
  // TODO Fase 3: server.register(ingestRoute, { prefix: '/api/hardware' })
  // TODO Fase 3: server.register(farmsRoute, { prefix: '/api/farms' })
  // TODO Fase 3: server.register(readingsRoute, { prefix: '/api/readings' })
  // TODO Fase 3: server.register(complianceRoute, { prefix: '/api/compliance' })

  // ── Health check ────────────────────────────────────────────────────────
  server.get('/health', async () => ({
    status: 'ok',
    service: 'groundtruth-api',
    timestamp: new Date().toISOString(),
  }));

  return server;
}

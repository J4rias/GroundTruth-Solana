import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildServer } from '../../server.js';

// Mock all plugins to prevent actual connections
vi.mock('../../plugins/cors.js', () => ({
  corsPlugin: async () => {},
}));

vi.mock('../../plugins/redis.js', () => ({
  redisPlugin: async (fastify: any) => {
    fastify.decorate('redis', {});
  },
}));

vi.mock('../../plugins/prisma.js', () => ({
  prismaPlugin: async (fastify: any) => {
    fastify.decorate('prisma', {});
  },
}));

describe('routes/health', () => {
  let server: Awaited<ReturnType<typeof buildServer>>;

  beforeEach(async () => {
    server = await buildServer();
  });

  it('GET /health returns 200 with service info', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toMatchObject({
      status: 'ok',
      service: 'groundtruth-api',
      timestamp: expect.any(String),
    });
  });

  it('/health timestamp is a valid ISO string', async () => {
    const response = await server.inject({
      method: 'GET',
      url: '/health',
    });

    const body = JSON.parse(response.body);
    expect(() => new Date(body.timestamp)).not.toThrow();
  });
});

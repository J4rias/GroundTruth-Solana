import type { FastifyInstance } from 'fastify';
import { getFarms, getFarmById, getFarmNodes } from '../../services/farm.service.js';
import { getReadingsToday } from '../../services/reading.service.js';
import type { FarmOverviewStats } from '@groundtruth/types';

export async function farmsRoute(fastify: FastifyInstance): Promise<void> {
  // GET /api/farms
  fastify.get('/', async () => {
    return getFarms(fastify);
  });

  // GET /api/farms/:id
  fastify.get<{ Params: { id: string } }>('/:id', async (request) => {
    return getFarmById(fastify, request.params.id);
  });

  // GET /api/farms/:id/nodes
  fastify.get<{ Params: { id: string } }>('/:id/nodes', async (request) => {
    return getFarmNodes(fastify, request.params.id);
  });

  // GET /api/farms/:id/overview — stat cards for dashboard
  fastify.get<{ Params: { id: string } }>('/:id/overview', async (request): Promise<FarmOverviewStats> => {
    const farmId = request.params.id;

    const [nodes, readingsToday, lastReading] = await Promise.all([
      getFarmNodes(fastify, farmId),
      getReadingsToday(fastify, farmId),
      fastify.prisma.sensorReading.findFirst({
        where: { farm_id: farmId, status: 'CONFIRMED', tx_signature: { not: null } },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    const activeNodes = nodes.filter((n) => n.is_active).length;

    // Compliance score: ratio of compliant readings in last 100
    const recentReadings = await fastify.prisma.sensorReading.findMany({
      where: { farm_id: farmId, status: 'CONFIRMED' },
      orderBy: { created_at: 'desc' },
      take: 100,
      select: { temperature_c: true, humidity_pct: true },
    });

    const compliant = recentReadings.filter(
      (r) =>
        r.temperature_c >= 10 && r.temperature_c <= 35 &&
        r.humidity_pct >= 20 && r.humidity_pct <= 90,
    ).length;

    const complianceScorePct =
      recentReadings.length > 0
        ? Math.round((compliant / recentReadings.length) * 100)
        : 0;

    return {
      active_nodes: activeNodes,
      readings_today: readingsToday,
      compliance_score_pct: complianceScorePct,
      last_tx_signature: lastReading?.tx_signature ?? null,
      last_tx_at: lastReading?.created_at ?? null,
    };
  });
}

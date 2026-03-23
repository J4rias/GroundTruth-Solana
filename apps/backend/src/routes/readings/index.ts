import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AppError, ErrorCode } from '@groundtruth/types';
import { getReadings } from '../../services/reading.service.js';

const querySchema = z.object({
  farmId: z.string().min(1),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export async function readingsRoute(fastify: FastifyInstance): Promise<void> {
  // GET /api/readings?farmId=...&page=1&limit=20
  fastify.get<{ Querystring: z.infer<typeof querySchema> }>('/', async (request) => {
    const result = querySchema.safeParse(request.query);
    if (!result.success) {
      throw new AppError(
        ErrorCode.VALIDATION_ERROR,
        result.error.issues[0]?.message ?? 'Invalid query params',
        400,
        { issues: result.error.issues },
      );
    }
    const { farmId, page, limit } = result.data;
    return getReadings(fastify, farmId, page, limit);
  });
}

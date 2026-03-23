import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AppError, ErrorCode, type IngestResponse } from '@groundtruth/types';
import { rateLimitByNodeId } from '../../middleware/rateLimiter.js';
import { verifyDataHash } from '../../crypto/hash.js';
import { getNodeByNodeId, updateNodeLastSeen } from '../../services/farm.service.js';
import { createReading, confirmReading, failReading } from '../../services/reading.service.js';
import { certifyReading } from '../../solana/client.js';
import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';

const ingestSchema = z.object({
  node_id: z.string().min(1).max(32),
  farm_id: z.string().min(1),
  sequence: z.number().int().nonnegative(),
  temperature_c: z.number(),
  humidity_pct: z.number(),
  pressure_hpa: z.number(),
  soil_moisture_pct: z.number().min(0).max(100),
  light_lux: z.number().nonnegative(),
  co2_ppm: z.number().nonnegative(),
  battery_mv: z.number().int(),
  rssi_dbm: z.number().int(),
  uptime_seconds: z.number().int().nonnegative(),
  timestamp: z.number().int().positive(),
  data_hash: z.string().length(64), // SHA-256 hex
  version: z.string().optional(),
});

export async function ingestRoute(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Body: z.infer<typeof ingestSchema> }>(
    '/ingest',
    async (request, reply): Promise<IngestResponse> => {
      // 1. Validate schema
      const result = ingestSchema.safeParse(request.body);
      if (!result.success) {
        throw new AppError(
          ErrorCode.VALIDATION_ERROR,
          result.error.issues[0]?.message ?? 'Invalid payload',
          400,
          { issues: result.error.issues },
        );
      }
      const payload = result.data;

      // 2. Rate limit
      await rateLimitByNodeId(fastify, payload.node_id);

      // 3. Verify SHA-256 chain-of-custody
      verifyDataHash(payload);

      // 4. Verify node exists and is active
      const node = await getNodeByNodeId(fastify, payload.node_id);

      // 5. Save reading as PENDING
      const reading = await createReading(fastify, payload, node.farm_id);

      // 6. Update node last_seen
      await updateNodeLastSeen(fastify, payload.node_id, payload.battery_mv);

      // 7. Certify on Solana (only if program ID is configured)
      if (!env.GROUNDTRUTH_PROGRAM_ID) {
        logger.warn('GROUNDTRUTH_PROGRAM_ID not set — skipping on-chain certification', {
          readingId: reading.id,
        });
        return reply.status(201).send({
          success: true,
          reading_id: reading.id,
          tx_signature: 'PROGRAM_ID_NOT_CONFIGURED',
          pda_address: '',
          explorer_url: '',
        });
      }

      // Get farm_pubkey from DB
      const farm = await fastify.prisma.farm.findUnique({ where: { id: node.farm_id } });
      if (!farm?.farm_pubkey) {
        logger.warn('Farm has no on-chain pubkey — skipping certification', {
          farmId: node.farm_id,
        });
        return reply.status(201).send({
          success: true,
          reading_id: reading.id,
          tx_signature: 'FARM_NOT_INITIALIZED_ON_CHAIN',
          pda_address: '',
          explorer_url: '',
        });
      }

      try {
        const txResult = await certifyReading({
          nodeId: payload.node_id,
          farmPubkey: farm.farm_pubkey,
          dataHash: payload.data_hash,
          temperatureC: payload.temperature_c,
          humidityPct: payload.humidity_pct,
          pressureHpa: payload.pressure_hpa,
          timestamp: payload.timestamp,
        });

        // 8. Update reading as CONFIRMED
        await confirmReading(fastify, reading.id, txResult.signature, txResult.pda_address);

        logger.info('Ingest complete', {
          readingId: reading.id,
          nodeId: payload.node_id,
          txSignature: txResult.signature,
        });

        return reply.status(201).send({
          success: true,
          reading_id: reading.id,
          tx_signature: txResult.signature,
          pda_address: txResult.pda_address,
          explorer_url: txResult.explorer_url,
        });
      } catch (err) {
        await failReading(fastify, reading.id);
        throw err;
      }
    },
  );
}

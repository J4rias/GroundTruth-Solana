import type { FastifyInstance } from 'fastify';
import { getComplianceScore, getEUDRProofChain } from '../../services/compliance.service.js';

export async function complianceRoute(fastify: FastifyInstance): Promise<void> {
  // GET /api/compliance/score/:farmId
  fastify.get<{ Params: { farmId: string } }>('/score/:farmId', async (request) => {
    return getComplianceScore(fastify, request.params.farmId);
  });

  // GET /api/compliance/proof/:farmId — EUDR on-chain proof chain
  fastify.get<{ Params: { farmId: string } }>('/proof/:farmId', async (request) => {
    return getEUDRProofChain(fastify, request.params.farmId);
  });
}

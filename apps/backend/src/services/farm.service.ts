import type { FastifyInstance } from 'fastify';
import { AppError, ErrorCode, type Farm, type FarmNode } from '@groundtruth/types';
import { logger } from '../config/logger.js';

export async function getFarms(fastify: FastifyInstance): Promise<Farm[]> {
  try {
    const rows = await fastify.prisma.farm.findMany({
      where: { is_active: true },
      orderBy: { created_at: 'desc' },
    });
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      location: r.location,
      owner_pubkey: r.owner_pubkey,
      farm_pubkey: r.farm_pubkey,
      is_active: r.is_active,
      created_at: r.created_at,
    }));
  } catch (err) {
    logger.error('getFarms failed', { err });
    throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch farms', 500, { err });
  }
}

export async function getFarmById(fastify: FastifyInstance, id: string): Promise<Farm> {
  try {
    const row = await fastify.prisma.farm.findUnique({ where: { id } });
    if (!row) {
      throw new AppError(ErrorCode.FARM_NOT_FOUND, `Farm ${id} not found`, 404, { id });
    }
    return {
      id: row.id,
      name: row.name,
      location: row.location,
      owner_pubkey: row.owner_pubkey,
      farm_pubkey: row.farm_pubkey,
      is_active: row.is_active,
      created_at: row.created_at,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('getFarmById failed', { err, id });
    throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch farm', 500, { err });
  }
}

export async function getFarmNodes(
  fastify: FastifyInstance,
  farmId: string,
): Promise<FarmNode[]> {
  try {
    const rows = await fastify.prisma.farmNode.findMany({
      where: { farm_id: farmId },
      orderBy: { node_id: 'asc' },
    });
    return rows.map((r) => ({
      id: r.id,
      node_id: r.node_id,
      farm_id: r.farm_id,
      node_pubkey: r.node_pubkey,
      is_active: r.is_active,
      last_seen: r.last_seen,
      battery_mv: r.battery_mv,
      created_at: r.created_at,
    }));
  } catch (err) {
    logger.error('getFarmNodes failed', { err, farmId });
    throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch nodes', 500, { err });
  }
}

export async function getNodeByNodeId(
  fastify: FastifyInstance,
  nodeId: string,
): Promise<FarmNode> {
  try {
    const row = await fastify.prisma.farmNode.findUnique({ where: { node_id: nodeId } });
    if (!row) {
      throw new AppError(ErrorCode.NODE_NOT_FOUND, `Node ${nodeId} not found`, 404, { nodeId });
    }
    if (!row.is_active) {
      throw new AppError(ErrorCode.NODE_INACTIVE, `Node ${nodeId} is inactive`, 403, { nodeId });
    }
    return {
      id: row.id,
      node_id: row.node_id,
      farm_id: row.farm_id,
      node_pubkey: row.node_pubkey,
      is_active: row.is_active,
      last_seen: row.last_seen,
      battery_mv: row.battery_mv,
      created_at: row.created_at,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('getNodeByNodeId failed', { err, nodeId });
    throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch node', 500, { err });
  }
}

export async function updateNodeLastSeen(
  fastify: FastifyInstance,
  nodeId: string,
  batteryMv: number,
): Promise<void> {
  try {
    await fastify.prisma.farmNode.update({
      where: { node_id: nodeId },
      data: { last_seen: new Date(), battery_mv: batteryMv },
    });
  } catch (err) {
    logger.error('updateNodeLastSeen failed', { err, nodeId });
    throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update node', 500, { err });
  }
}

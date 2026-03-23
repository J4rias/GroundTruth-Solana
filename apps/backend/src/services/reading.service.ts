import type { FastifyInstance } from 'fastify';
import { AppError, ErrorCode, type SensorReading, type NodeReading } from '@groundtruth/types';
import { logger } from '../config/logger.js';

export async function createReading(
  fastify: FastifyInstance,
  payload: NodeReading,
  farmId: string,
): Promise<SensorReading> {
  try {
    const row = await fastify.prisma.sensorReading.create({
      data: {
        node_id: payload.node_id,
        farm_id: farmId,
        sequence: payload.sequence,
        temperature_c: payload.temperature_c,
        humidity_pct: payload.humidity_pct,
        pressure_hpa: payload.pressure_hpa,
        soil_moisture_pct: payload.soil_moisture_pct,
        light_lux: payload.light_lux,
        co2_ppm: payload.co2_ppm,
        battery_mv: payload.battery_mv,
        rssi_dbm: payload.rssi_dbm,
        uptime_seconds: payload.uptime_seconds,
        data_hash: payload.data_hash,
        status: 'PENDING',
        created_at: new Date(payload.timestamp),
      },
    });
    return toSensorReading(row);
  } catch (err) {
    logger.error('createReading failed', { err, node_id: payload.node_id });
    throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to save reading', 500, { err });
  }
}

export async function confirmReading(
  fastify: FastifyInstance,
  id: string,
  txSignature: string,
  pdaAddress: string,
): Promise<void> {
  try {
    await fastify.prisma.sensorReading.update({
      where: { id },
      data: { status: 'CONFIRMED', tx_signature: txSignature, pda_address: pdaAddress },
    });
  } catch (err) {
    logger.error('confirmReading failed', { err, id });
    throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to confirm reading', 500, { err });
  }
}

export async function failReading(fastify: FastifyInstance, id: string): Promise<void> {
  try {
    await fastify.prisma.sensorReading.update({
      where: { id },
      data: { status: 'FAILED' },
    });
  } catch (err) {
    logger.error('failReading failed', { err, id });
    throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to update reading status', 500, { err });
  }
}

export async function getReadings(
  fastify: FastifyInstance,
  farmId: string,
  page = 1,
  limit = 20,
): Promise<{ data: SensorReading[]; total: number }> {
  try {
    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      fastify.prisma.sensorReading.findMany({
        where: { farm_id: farmId },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      fastify.prisma.sensorReading.count({ where: { farm_id: farmId } }),
    ]);
    return { data: rows.map(toSensorReading), total };
  } catch (err) {
    logger.error('getReadings failed', { err, farmId });
    throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch readings', 500, { err });
  }
}

export async function getReadingsToday(
  fastify: FastifyInstance,
  farmId: string,
): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  try {
    return await fastify.prisma.sensorReading.count({
      where: { farm_id: farmId, created_at: { gte: startOfDay } },
    });
  } catch (err) {
    logger.error('getReadingsToday failed', { err, farmId });
    throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to count readings', 500, { err });
  }
}

// ── Internal mapper ────────────────────────────────────────────────────────────

function toSensorReading(row: {
  id: string;
  node_id: string;
  farm_id: string;
  sequence: number;
  temperature_c: number;
  humidity_pct: number;
  pressure_hpa: number;
  soil_moisture_pct: number;
  light_lux: number;
  co2_ppm: number;
  battery_mv: number;
  rssi_dbm: number;
  uptime_seconds: number;
  data_hash: string;
  status: string;
  tx_signature: string | null;
  pda_address: string | null;
  created_at: Date;
}): SensorReading {
  return {
    id: row.id,
    node_id: row.node_id,
    farm_id: row.farm_id,
    sequence: row.sequence,
    temperature_c: row.temperature_c,
    humidity_pct: row.humidity_pct,
    pressure_hpa: row.pressure_hpa,
    soil_moisture_pct: row.soil_moisture_pct,
    light_lux: row.light_lux,
    co2_ppm: row.co2_ppm,
    battery_mv: row.battery_mv,
    rssi_dbm: row.rssi_dbm,
    uptime_seconds: row.uptime_seconds,
    data_hash: row.data_hash,
    status: row.status as SensorReading['status'],
    tx_signature: row.tx_signature,
    pda_address: row.pda_address,
    created_at: row.created_at,
  };
}

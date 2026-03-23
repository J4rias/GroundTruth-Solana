import type { FastifyInstance } from 'fastify';
import {
  AppError,
  ErrorCode,
  EUDR_THRESHOLDS,
  complianceLevelFromScore,
  type ComplianceScore,
} from '@groundtruth/types';
import { logger } from '../config/logger.js';

export async function getComplianceScore(
  fastify: FastifyInstance,
  farmId: string,
): Promise<ComplianceScore> {
  try {
    const readings = await fastify.prisma.sensorReading.findMany({
      where: { farm_id: farmId, status: 'CONFIRMED' },
      orderBy: { created_at: 'desc' },
      take: 100, // last 100 confirmed readings
    });

    if (readings.length === 0) {
      return {
        farm_id: farmId,
        score: 0,
        raw_score: 0,
        level: 'NON_COMPLIANT',
        total_readings: 0,
        compliant_readings: 0,
        last_evaluated_at: new Date(),
        parameters: [],
      };
    }

    const t = EUDR_THRESHOLDS;
    let compliant = 0;

    for (const r of readings) {
      const tempOk = r.temperature_c >= t.temperature_min_c && r.temperature_c <= t.temperature_max_c;
      const humOk = r.humidity_pct >= t.humidity_min_pct && r.humidity_pct <= t.humidity_max_pct;
      if (tempOk && humOk) compliant++;
    }

    const rawScore = compliant - (readings.length - compliant) * 2; // mirrors on-chain logic
    const score = Math.max(0, Math.min(100, Math.round((compliant / readings.length) * 100)));

    // Compute average values for parameter table
    const avgTemp = readings.reduce((s, r) => s + r.temperature_c, 0) / readings.length;
    const avgHum = readings.reduce((s, r) => s + r.humidity_pct, 0) / readings.length;

    return {
      farm_id: farmId,
      score,
      raw_score: rawScore,
      level: complianceLevelFromScore(score),
      total_readings: readings.length,
      compliant_readings: compliant,
      last_evaluated_at: new Date(),
      parameters: [
        {
          name: 'Temperature',
          current_value: Math.round(avgTemp * 10) / 10,
          min_threshold: t.temperature_min_c,
          max_threshold: t.temperature_max_c,
          unit: '°C',
          is_compliant: avgTemp >= t.temperature_min_c && avgTemp <= t.temperature_max_c,
        },
        {
          name: 'Humidity',
          current_value: Math.round(avgHum * 10) / 10,
          min_threshold: t.humidity_min_pct,
          max_threshold: t.humidity_max_pct,
          unit: '%',
          is_compliant: avgHum >= t.humidity_min_pct && avgHum <= t.humidity_max_pct,
        },
      ],
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('getComplianceScore failed', { err, farmId });
    throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to compute compliance score', 500, { err });
  }
}

export async function getEUDRProofChain(
  fastify: FastifyInstance,
  farmId: string,
  limit = 10,
) {
  try {
    const rows = await fastify.prisma.sensorReading.findMany({
      where: { farm_id: farmId, status: 'CONFIRMED', tx_signature: { not: null } },
      orderBy: { created_at: 'desc' },
      take: limit,
    });

    const t = EUDR_THRESHOLDS;
    return rows.map((r) => ({
      tx_signature: r.tx_signature as string,
      pda_address: r.pda_address as string,
      timestamp: r.created_at,
      temperature_c: r.temperature_c,
      humidity_pct: r.humidity_pct,
      is_compliant:
        r.temperature_c >= t.temperature_min_c &&
        r.temperature_c <= t.temperature_max_c &&
        r.humidity_pct >= t.humidity_min_pct &&
        r.humidity_pct <= t.humidity_max_pct,
    }));
  } catch (err) {
    logger.error('getEUDRProofChain failed', { err, farmId });
    throw new AppError(ErrorCode.DATABASE_ERROR, 'Failed to fetch proof chain', 500, { err });
  }
}

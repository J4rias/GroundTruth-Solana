import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import { AppError, ErrorCode, isAppError } from '@groundtruth/types';
import { logger } from '../config/logger.js';

// ── Global Fastify error handler ──────────────────────────────────────────────
// Rules:
//   1. Never expose stack traces to the client
//   2. Always log full error server-side
//   3. Always include requestId for tracing

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply,
): void {
  const requestId = (request.id as string | undefined) ?? randomUUID();

  // ── AppError — known, typed application errors ────────────────────────────
  if (isAppError(error)) {
    logger.warn('AppError', {
      requestId,
      code: error.code,
      message: error.message,
      statusCode: error.statusCode,
      context: error.context,
      path: request.url,
      method: request.method,
    });

    void reply.status(error.statusCode).send({
      error: error.code,
      message: error.message,
      requestId,
    });
    return;
  }

  // ── Fastify validation errors (Zod / JSON schema) ─────────────────────────
  if ('validation' in error && error.validation !== undefined) {
    logger.warn('ValidationError', {
      requestId,
      message: error.message,
      path: request.url,
    });

    void reply.status(400).send({
      error: ErrorCode.VALIDATION_ERROR,
      message: error.message,
      requestId,
    });
    return;
  }

  // ── Fastify 404 ───────────────────────────────────────────────────────────
  if ('statusCode' in error && error.statusCode === 404) {
    void reply.status(404).send({
      error: 'NOT_FOUND',
      message: 'Route not found',
      requestId,
    });
    return;
  }

  // ── Unknown / unhandled errors — log full details, never expose ───────────
  logger.error('UnhandledError', {
    requestId,
    message: error.message,
    stack: error.stack,
    path: request.url,
    method: request.method,
  });

  void reply.status(500).send({
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    requestId,
  });
}

// ── Error codes — exhaustive taxonomy used across all packages ───────────────

export enum ErrorCode {
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  HASH_MISMATCH = 'HASH_MISMATCH',

  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Resources
  FARM_NOT_FOUND = 'FARM_NOT_FOUND',
  NODE_NOT_FOUND = 'NODE_NOT_FOUND',
  NODE_INACTIVE = 'NODE_INACTIVE',

  // Infrastructure
  SOLANA_TX_FAILED = 'SOLANA_TX_FAILED',
  SOLANA_TIMEOUT = 'SOLANA_TIMEOUT',
  DATABASE_ERROR = 'DATABASE_ERROR',
  REDIS_ERROR = 'REDIS_ERROR',
}

// ── AppError — typed application error ───────────────────────────────────────

export class AppError extends Error {
  public override readonly name = 'AppError';

  constructor(
    public readonly code: ErrorCode,
    public override readonly message: string,
    public readonly statusCode: number,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

// ── Type guard ────────────────────────────────────────────────────────────────

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

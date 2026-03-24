import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

// ── Environment schema — validated at startup, never at runtime ───────────────

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Solana
  SOLANA_RPC_URL: z.string().url('SOLANA_RPC_URL must be a valid URL'),
  SOLANA_KEYPAIR_PATH: z
    .string()
    .min(1, 'SOLANA_KEYPAIR_PATH is required'),
  GROUNDTRUTH_PROGRAM_ID: z.string().default(''),

  // Supabase (server-side only)
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  // Intentional process exit — env must be valid before app starts
  process.stderr.write(`\n[GroundTruth] Invalid environment variables:\n${issues}\n\n`);
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

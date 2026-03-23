import { buildServer } from './server.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

// ── GroundTruth API — Entry Point ─────────────────────────────────────────────

const server = await buildServer();

try {
  await server.listen({ port: env.PORT, host: '0.0.0.0' });
  logger.info('GroundTruth API started', {
    port: env.PORT,
    env: env.NODE_ENV,
    cluster: 'devnet',
  });
} catch (err) {
  logger.error('Fatal: failed to start server', { err });
  process.exit(1);
}

import { readFileSync } from 'fs';
import { Keypair } from '@solana/web3.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

let _keypair: Keypair | null = null;

export function getServerKeypair(): Keypair {
  if (_keypair) return _keypair;

  try {
    const raw = readFileSync(env.SOLANA_KEYPAIR_PATH, 'utf-8');
    const secretKey = Uint8Array.from(JSON.parse(raw) as number[]);
    _keypair = Keypair.fromSecretKey(secretKey);
    logger.info('Server keypair loaded', { pubkey: _keypair.publicKey.toString() });
    return _keypair;
  } catch (err) {
    logger.error('Failed to load server keypair', { path: env.SOLANA_KEYPAIR_PATH, err });
    throw new Error(`Cannot load keypair from ${env.SOLANA_KEYPAIR_PATH}`);
  }
}

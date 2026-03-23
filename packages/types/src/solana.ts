// ── Solana TX result ──────────────────────────────────────────────────────────

export interface TxResult {
  signature: string;
  pda_address: string;
  explorer_url: string;
  confirmed_at: Date;
}

// ── ReadingCertificate — on-chain PDA account (mirrors lib.rs) ───────────────

export interface ReadingCertificate {
  node_id: string;
  farm: string; // Pubkey as base58
  data_hash: number[]; // [u8; 32] — serialized as array
  temperature_x10: number; // i32 — multiply float by 10 (no floats in Solana)
  humidity_x10: number; // u32
  pressure_x10: number; // u32
  timestamp: number; // i64 — Unix seconds
  bump: number;
}

// ── HTTP responses ────────────────────────────────────────────────────────────

export interface IngestResponse {
  success: true;
  reading_id: string;
  tx_signature: string;
  pda_address: string;
  explorer_url: string;
}

// ── Solana configuration ──────────────────────────────────────────────────────

export type SolanaCluster = 'devnet' | 'mainnet-beta' | 'localnet';

export interface SolanaConfig {
  rpc_url: string;
  program_id: string;
  cluster: SolanaCluster;
}

// ── Helper: float → x10 integer (for Solana instruction args) ────────────────

export function toX10(value: number): number {
  return Math.round(value * 10);
}

export function fromX10(value: number): number {
  return value / 10;
}

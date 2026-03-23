// ── Farm — off-chain PostgreSQL record ───────────────────────────────────────

export interface Farm {
  id: string;
  name: string;
  location: string;
  owner_pubkey: string;
  farm_pubkey: string | null; // on-chain PDA — set after initialize_farm
  is_active: boolean;
  created_at: Date;
}

// ── FarmNode — IoT node registered to a farm ─────────────────────────────────

export interface FarmNode {
  id: string;
  node_id: string; // e.g. "GT-NODE-001"
  farm_id: string; // FK → Farm.id
  node_pubkey: string | null; // on-chain PDA — set after register_node
  is_active: boolean;
  last_seen: Date | null;
  battery_mv: number | null;
  created_at: Date;
}

// ── On-chain Anchor account structs (mirrors lib.rs) ─────────────────────────

export interface FarmAccount {
  owner: string; // Pubkey as base58
  name: string;
  location: string;
  reading_count: number; // u64
  compliance_score: number; // i64 — can go negative
  bump: number;
}

export interface NodeAccount {
  node_id: string;
  farm: string; // Pubkey as base58
  is_active: boolean;
  last_seen: number; // Unix timestamp (i64 from Solana)
  bump: number;
}

// ── Dashboard stats ───────────────────────────────────────────────────────────

export interface FarmOverviewStats {
  active_nodes: number;
  readings_today: number;
  compliance_score_pct: number; // 0–100
  last_tx_signature: string | null;
  last_tx_at: Date | null;
}

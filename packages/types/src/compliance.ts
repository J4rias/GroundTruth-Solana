// ── EUDR Thresholds — defined by EU Deforestation Regulation for tropical crops

export interface EUDRThresholds {
  temperature_min_c: number; // 10°C
  temperature_max_c: number; // 35°C
  humidity_min_pct: number; // 20%
  humidity_max_pct: number; // 90%
}

export const EUDR_THRESHOLDS: EUDRThresholds = {
  temperature_min_c: 10,
  temperature_max_c: 35,
  humidity_min_pct: 20,
  humidity_max_pct: 90,
} as const;

// ── Compliance level ──────────────────────────────────────────────────────────

export type ComplianceLevel = 'COMPLIANT' | 'WARNING' | 'NON_COMPLIANT';

export function complianceLevelFromScore(score: number): ComplianceLevel {
  if (score >= 70) return 'COMPLIANT';
  if (score >= 40) return 'WARNING';
  return 'NON_COMPLIANT';
}

// ── Compliance score — computed off-chain from on-chain reading_count ─────────

export interface ComplianceScore {
  farm_id: string;
  score: number; // 0–100 normalized
  raw_score: number; // on-chain i64
  level: ComplianceLevel;
  total_readings: number;
  compliant_readings: number;
  last_evaluated_at: Date;
  parameters: ComplianceParameter[];
}

export interface ComplianceParameter {
  name: string;
  current_value: number;
  min_threshold: number;
  max_threshold: number;
  unit: string;
  is_compliant: boolean;
}

// ── EUDR Proof — on-chain TX chain for audit trail ───────────────────────────

export interface EUDRProofEntry {
  tx_signature: string;
  pda_address: string;
  timestamp: Date;
  temperature_c: number;
  humidity_pct: number;
  is_compliant: boolean;
}

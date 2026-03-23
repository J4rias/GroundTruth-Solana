import { api } from './client.js';
import type { ComplianceScore } from '@groundtruth/types';

export interface ProofEntry {
  tx_signature: string;
  pda_address: string;
  timestamp: string;
  temperature_c: number;
  humidity_pct: number;
  is_compliant: boolean;
}

export const complianceApi = {
  getScore: (farmId: string) => api.get<ComplianceScore>(`/api/compliance/score/${farmId}`),

  getProofChain: (farmId: string) => api.get<ProofEntry[]>(`/api/compliance/proof/${farmId}`),
};

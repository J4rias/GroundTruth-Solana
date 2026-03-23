import { api } from './client.js';
import type { Farm, FarmNode } from '@groundtruth/types';

export interface FarmOverviewStats {
  active_nodes: number;
  readings_today: number;
  compliance_score_pct: number;
  last_tx_signature: string | null;
  last_tx_at: string | null;
}

export const farmsApi = {
  list: () => api.get<Farm[]>('/api/farms'),

  getById: (id: string) => api.get<Farm>(`/api/farms/${id}`),

  getNodes: (id: string) => api.get<FarmNode[]>(`/api/farms/${id}/nodes`),

  getOverview: (id: string) => api.get<FarmOverviewStats>(`/api/farms/${id}/overview`),
};

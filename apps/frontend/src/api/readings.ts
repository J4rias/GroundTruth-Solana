import { api } from './client.js';
import type { SensorReading } from '@groundtruth/types';

export interface ReadingsPage {
  data: SensorReading[];
  total: number;
}

export const readingsApi = {
  list: (farmId: string, page = 1, limit = 20) =>
    api.get<ReadingsPage>(`/api/readings?farmId=${farmId}&page=${page}&limit=${limit}`),
};

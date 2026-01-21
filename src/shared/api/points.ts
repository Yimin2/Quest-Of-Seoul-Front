import { apiRequest } from './base';

export interface PointTransaction {
  id: number;
  user_id: string;
  value: number;
  reason: string;
  created_at: string;
}

export interface PointsResponse {
  total_points: number;
  transactions: PointTransaction[];
}

export const pointsApi = {
  async getPoints(): Promise<PointsResponse> {
    return apiRequest<PointsResponse>('/reward/points', {
      method: 'GET',
    });
  },
};

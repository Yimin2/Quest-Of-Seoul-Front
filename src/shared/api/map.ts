import { apiRequest } from './base';

export interface WalkDistanceRequest {
  quest_ids: number[];
  user_latitude: number;
  user_longitude: number;
}

export interface WalkDistanceResponse {
  success: boolean;
  total_distance_km: number;
  route: {
    from: {
      type: string;
      quest_id?: number;
      name?: string;
      latitude?: number;
      longitude?: number;
    };
    to: {
      quest_id: number;
      name: string;
      latitude: number;
      longitude: number;
    };
    distance_km: number;
  }[];
}

export const mapApi = {
  async calculateWalkDistance(request: WalkDistanceRequest): Promise<WalkDistanceResponse> {
    return apiRequest<WalkDistanceResponse>('/map/stats/walk-distance', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  },
};

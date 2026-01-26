import { apiRequest } from './base';
import { fromZodError } from 'zod-validation-error';
import {
  WalkDistanceResponseSchema,
  type WalkDistanceRequest,
  type WalkDistanceResponse,
} from './schema';

export type { WalkDistanceRequest, WalkDistanceResponse };

export const mapApi = {
  async calculateWalkDistance(request: WalkDistanceRequest): Promise<WalkDistanceResponse> {
    const data = await apiRequest<unknown>('/map/stats/walk-distance', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    const result = WalkDistanceResponseSchema.safeParse(data);

    if (!result.success) {
      const validationError = fromZodError(result.error);
      console.error('WalkDistance Validation Error:', validationError.toString());
      throw validationError;
    }

    return result.data;
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

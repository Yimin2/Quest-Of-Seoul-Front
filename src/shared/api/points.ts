import { apiRequest } from './base';
import { fromZodError } from 'zod-validation-error';
import {
  PointsResponseSchema,
  type PointsResponse,
  type PointTransaction,
} from './schema';

export type { PointsResponse, PointTransaction };

export const pointsApi = {
  async getPoints(): Promise<PointsResponse> {
    const data = await apiRequest<unknown>('/reward/points', {
      method: 'GET',
    });

    const result = PointsResponseSchema.safeParse(data);

    if (!result.success) {
      const validationError = fromZodError(result.error);
      console.error('Points Validation Error:', validationError.toString());
      throw validationError;
    }

    return result.data;
  },
};

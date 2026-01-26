import { apiRequest } from './base';
import { fromZodError } from 'zod-validation-error';
import {
  RewardsResponseSchema,
  ClaimRewardResponseSchema,
  ClaimedRewardsResponseSchema,
  UseRewardResponseSchema,
  type Reward,
  type RewardsResponse,
  type ClaimRewardResponse,
  type ClaimedReward,
  type ClaimedRewardsResponse,
  type UseRewardResponse,
} from './schema';

export type {
  Reward,
  RewardsResponse,
  ClaimRewardResponse,
  ClaimedReward,
  ClaimedRewardsResponse,
  UseRewardResponse,
};

export const rewardApi = {
  async getRewards(type?: string, search?: string): Promise<RewardsResponse> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (search) params.append('search', search);

    const queryString = params.toString();
    const url = queryString ? `/reward/list?${queryString}` : '/reward/list';

    const data = await apiRequest<unknown>(url, {
      method: 'GET',
    });

    const result = RewardsResponseSchema.safeParse(data);

    if (!result.success) {
      const validationError = fromZodError(result.error);
      console.error('Rewards Validation Error:', validationError.toString());
      throw validationError;
    }

    return result.data;
  },

  async claim(reward_id: number): Promise<ClaimRewardResponse> {
    const data = await apiRequest<unknown>('/reward/claim', {
      method: 'POST',
      body: JSON.stringify({ reward_id }),
    });

    const result = ClaimRewardResponseSchema.safeParse(data);

    if (!result.success) {
      const validationError = fromZodError(result.error);
      console.error('ClaimReward Validation Error:', validationError.toString());
      throw validationError;
    }

    return result.data;
  },

  async getClaimedRewards(): Promise<ClaimedRewardsResponse> {
    const data = await apiRequest<unknown>('/reward/claimed', {
      method: 'GET',
    });

    const result = ClaimedRewardsResponseSchema.safeParse(data);

    if (!result.success) {
      const validationError = fromZodError(result.error);
      console.error('ClaimedRewards Validation Error:', validationError.toString());
      throw validationError;
    }

    return result.data;
  },

  async useReward(reward_id: number): Promise<UseRewardResponse> {
    const data = await apiRequest<unknown>(`/reward/use/${reward_id}`, {
      method: 'POST',
    });

    const result = UseRewardResponseSchema.safeParse(data);

    if (!result.success) {
      const validationError = fromZodError(result.error);
      console.error('UseReward Validation Error:', validationError.toString());
      throw validationError;
    }

    return result.data;
  },
};

import { apiRequest } from './base';

export interface Reward {
  id: number;
  name: string;
  description: string;
  point_cost: number;
  type: string;
  is_active: boolean;
  image_url?: string | null;
  expire_date?: string | null;
}

export interface RewardsResponse {
  rewards: Reward[];
}

export interface ClaimRewardResponse {
  status: string;
  message: string;
  reward?: string;
  qr_code?: string;
  remaining_points?: number;
  required?: number;
  current?: number;
  shortage?: number;
}

export interface ClaimedReward {
  id: number;
  user_id: string;
  reward_id: number;
  qr_code: string;
  claimed_at: string;
  used_at: string | null;
  rewards: Reward;
}

export interface ClaimedRewardsResponse {
  claimed_rewards: ClaimedReward[];
}

export interface UseRewardResponse {
  status: string;
  message: string;
}

export const rewardApi = {
  async getRewards(type?: string, search?: string): Promise<RewardsResponse> {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (search) params.append('search', search);

    const queryString = params.toString();
    const url = queryString ? `/reward/list?${queryString}` : '/reward/list';

    return apiRequest<RewardsResponse>(url, {
      method: 'GET',
    });
  },

  async claim(reward_id: number): Promise<ClaimRewardResponse> {
    return apiRequest<ClaimRewardResponse>('/reward/claim', {
      method: 'POST',
      body: JSON.stringify({ reward_id }),
    });
  },

  async getClaimedRewards(): Promise<ClaimedRewardsResponse> {
    return apiRequest<ClaimedRewardsResponse>('/reward/claimed', {
      method: 'GET',
    });
  },

  async useReward(reward_id: number): Promise<UseRewardResponse> {
    return apiRequest<UseRewardResponse>(`/reward/use/${reward_id}`, {
      method: 'POST',
    });
  },
};

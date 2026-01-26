import { z } from 'zod';

export const RewardSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  point_cost: z.number(),
  type: z.string(),
  is_active: z.boolean(),
  image_url: z.string().nullable().optional(),
  expire_date: z.string().nullable().optional(),
});

export type Reward = z.infer<typeof RewardSchema>;

export const RewardsResponseSchema = z.object({
  rewards: z.array(RewardSchema),
});

export type RewardsResponse = z.infer<typeof RewardsResponseSchema>;

export const ClaimRewardResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
  reward: z.string().optional(),
  qr_code: z.string().optional(),
  remaining_points: z.number().optional(),
  required: z.number().optional(),
  current: z.number().optional(),
  shortage: z.number().optional(),
});

export type ClaimRewardResponse = z.infer<typeof ClaimRewardResponseSchema>;

export const ClaimedRewardSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  reward_id: z.number(),
  qr_code: z.string(),
  claimed_at: z.string(),
  used_at: z.string().nullable(),
  rewards: RewardSchema,
});

export type ClaimedReward = z.infer<typeof ClaimedRewardSchema>;

export const ClaimedRewardsResponseSchema = z.object({
  claimed_rewards: z.array(ClaimedRewardSchema),
});

export type ClaimedRewardsResponse = z.infer<typeof ClaimedRewardsResponseSchema>;

export const UseRewardResponseSchema = z.object({
  status: z.string(),
  message: z.string(),
});

export type UseRewardResponse = z.infer<typeof UseRewardResponseSchema>;

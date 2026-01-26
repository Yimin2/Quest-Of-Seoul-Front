import { z } from 'zod';

export const WalkDistanceRequestSchema = z.object({
  quest_ids: z.array(z.number()),
  user_latitude: z.number(),
  user_longitude: z.number(),
});

export type WalkDistanceRequest = z.infer<typeof WalkDistanceRequestSchema>;

export const WalkDistanceResponseSchema = z.object({
  success: z.boolean(),
  total_distance_km: z.number(),
  route: z.array(
    z.object({
      from: z.object({
        type: z.string(),
        quest_id: z.number().optional(),
        name: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      }),
      to: z.object({
        quest_id: z.number(),
        name: z.string(),
        latitude: z.number(),
        longitude: z.number(),
      }),
      distance_km: z.number(),
    })
  ),
});

export type WalkDistanceResponse = z.infer<typeof WalkDistanceResponseSchema>;

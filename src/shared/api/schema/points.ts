import { z } from 'zod';

export const PointTransactionSchema = z.object({
  id: z.number(),
  user_id: z.string(),
  value: z.number(),
  reason: z.string(),
  created_at: z.string(),
});

export type PointTransaction = z.infer<typeof PointTransactionSchema>;

export const PointsResponseSchema = z.object({
  total_points: z.number(),
  transactions: z.array(PointTransactionSchema),
});

export type PointsResponse = z.infer<typeof PointsResponseSchema>;

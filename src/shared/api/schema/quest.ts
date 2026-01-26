import { z } from 'zod';

export const QuestSchema = z.object({
  id: z.number(),
  place_id: z.string().nullable(),
  name: z.string(),
  title: z.string().nullable(),
  description: z.string(),
  category: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  reward_point: z.number(),
  points: z.number(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  is_active: z.boolean(),
  completion_count: z.number(),
  created_at: z.string(),
  district: z.string().optional(),
  place_image_url: z.string().optional(),
  distance_km: z.number().optional(),
});

export type Quest = z.infer<typeof QuestSchema>;

export const QuestListResponseSchema = z.object({
  quests: z.array(QuestSchema),
});

export type QuestListResponse = z.infer<typeof QuestListResponseSchema>;

export const FilterRequestSchema = z.object({
  categories: z.array(z.string()).optional(),
  districts: z.array(z.string()).optional(),
  sort_by: z.enum(['nearest', 'rewarded', 'newest']).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius_km: z.number().optional(),
  limit: z.number().optional(),
});

export type FilterRequest = z.infer<typeof FilterRequestSchema>;

export const FilterResponseSchema = z.object({
  success: z.boolean(),
  count: z.number(),
  quests: z.array(QuestSchema),
  filters_applied: z.object({
    categories: z.array(z.string()),
    districts: z.array(z.string()),
    sort_by: z.string(),
  }),
});

export type FilterResponse = z.infer<typeof FilterResponseSchema>;

export const SearchRequestSchema = z.object({
  query: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius_km: z.number().optional(),
  limit: z.number().optional(),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;

export const SearchResponseSchema = z.object({
  success: z.boolean(),
  count: z.number(),
  quests: z.array(QuestSchema),
});

export type SearchResponse = z.infer<typeof SearchResponseSchema>;

export const QuestDetailResponseSchema = z.object({
  quest: QuestSchema,
  user_status: z
    .object({
      status: z.string(),
      started_at: z.string(),
      completed_at: z.string().optional(),
    })
    .nullable()
    .optional(),
  user_points: z.number().optional(),
});

export type QuestDetailResponse = z.infer<typeof QuestDetailResponseSchema>;

export const QuestStartRequestSchema = z.object({
  quest_id: z.number(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  start_latitude: z.number().optional(),
  start_longitude: z.number().optional(),
  place_id: z.string().optional(),
});

export type QuestStartRequest = z.infer<typeof QuestStartRequestSchema>;

export const QuestStartResponseSchema = z.object({
  quest: QuestSchema,
  place: z
    .object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      address: z.string(),
    })
    .nullable()
    .optional(),
  status: z.string(),
  place_id: z.string().nullable().optional(),
  message: z.string(),
});

export type QuestStartResponse = z.infer<typeof QuestStartResponseSchema>;

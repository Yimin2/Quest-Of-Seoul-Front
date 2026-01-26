import { z } from 'zod';
import { QuestSchema } from './quest';

// Docent Chat
export const DocentChatRequestSchema = z.object({
  landmark: z.string(),
  user_message: z.string(),
  language: z.string().optional(),
  prefer_url: z.boolean().optional(),
  enable_tts: z.boolean().optional(),
  quest_id: z.number().optional(),
  place_id: z.string().optional(),
});

export type DocentChatRequest = z.infer<typeof DocentChatRequestSchema>;

export const DocentChatResponseSchema = z.object({
  message: z.string(),
  landmark: z.string(),
  audio: z.string().nullable().optional(),
  audio_url: z.string().nullable().optional(),
});

export type DocentChatResponse = z.infer<typeof DocentChatResponseSchema>;

// VLM Analyze
export const VLMAnalyzeRequestSchema = z.object({
  image: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  language: z.string().optional(),
  prefer_url: z.boolean().optional(),
  enable_tts: z.boolean().optional(),
  use_cache: z.boolean().optional(),
});

export type VLMAnalyzeRequest = z.infer<typeof VLMAnalyzeRequestSchema>;

export const VLMAnalyzeResponseSchema = z.object({
  success: z.boolean(),
  description: z.string(),
  place: z
    .object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      address: z.string(),
    })
    .optional(),
  vlm_analysis: z.string().optional(),
  similar_places: z
    .array(
      z.object({
        place_id: z.string(),
        similarity: z.number(),
        image_url: z.string(),
      })
    )
    .optional(),
  confidence_score: z.number().optional(),
  processing_time_ms: z.number().optional(),
  vlm_provider: z.string().optional(),
  audio_url: z.string().optional(),
});

export type VLMAnalyzeResponse = z.infer<typeof VLMAnalyzeResponseSchema>;

// Quest VLM Chat
export const QuestVLMChatRequestSchema = z.object({
  image: z.string(),
  user_message: z.string().optional(),
  quest_id: z.number(),
  place_id: z.string().optional(),
  chat_session_id: z.string().optional(),
  language: z.string().optional(),
  prefer_url: z.boolean().optional(),
  enable_tts: z.boolean().optional(),
});

export type QuestVLMChatRequest = z.infer<typeof QuestVLMChatRequestSchema>;

export const QuestVLMChatResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  place: z
    .object({
      id: z.string(),
      name: z.string(),
      category: z.string(),
      address: z.string(),
    })
    .optional(),
  image_url: z.string().optional(),
  audio: z.string().optional(),
  audio_url: z.string().optional(),
  session_id: z.string(),
  quest_id: z.number(),
});

export type QuestVLMChatResponse = z.infer<typeof QuestVLMChatResponseSchema>;

// Similar Places
export const SimilarPlacesRequestSchema = z.object({
  image: z.string(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius_km: z.number().optional(),
  limit: z.number().optional(),
  quest_only: z.boolean().optional(),
});

export type SimilarPlacesRequest = z.infer<typeof SimilarPlacesRequestSchema>;

export const SimilarPlacesResponseSchema = z.object({
  success: z.boolean(),
  count: z.number(),
  recommendations: z.array(
    z.object({
      quest_id: z.number().optional(),
      place_id: z.string(),
      similarity: z.number(),
      name: z.string(),
      description: z.string(),
      category: z.string(),
      latitude: z.number(),
      longitude: z.number(),
      reward_point: z.number(),
      district: z.string().optional(),
      place_image_url: z.string().optional(),
      distance_km: z.number().optional(),
      place: z
        .object({
          id: z.string(),
          name: z.string(),
          category: z.string(),
        })
        .optional(),
    })
  ),
  filter: z
    .object({
      gps_enabled: z.boolean(),
      radius_km: z.number(),
      quest_only: z.boolean(),
    })
    .optional(),
});

export type SimilarPlacesResponse = z.infer<typeof SimilarPlacesResponseSchema>;

// STT + TTS
export const STTTTSRequestSchema = z.object({
  audio: z.string(),
  language_code: z.string().optional(),
  prefer_url: z.boolean().optional(),
});

export type STTTTSRequest = z.infer<typeof STTTTSRequestSchema>;

export const STTTTSResponseSchema = z.object({
  success: z.boolean(),
  transcribed_text: z.string(),
  audio_url: z.string().nullable().optional(),
  audio: z.string().optional(),
});

export type STTTTSResponse = z.infer<typeof STTTTSResponseSchema>;

// Explore RAG Chat
export const ExploreRAGChatRequestSchema = z.object({
  user_message: z.string(),
  language: z.string().optional(),
  prefer_url: z.boolean().optional(),
  enable_tts: z.boolean().optional(),
  chat_session_id: z.string().optional(),
});

export type ExploreRAGChatRequest = z.infer<typeof ExploreRAGChatRequestSchema>;

export const ExploreRAGChatResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  session_id: z.string(),
  audio: z.string().nullable().optional(),
  audio_url: z.string().nullable().optional(),
});

export type ExploreRAGChatResponse = z.infer<typeof ExploreRAGChatResponseSchema>;

// Quest RAG Chat
export const QuestRAGChatRequestSchema = z.object({
  quest_id: z.number(),
  user_message: z.string(),
  language: z.string().optional(),
  prefer_url: z.boolean().optional(),
  enable_tts: z.boolean().optional(),
  chat_session_id: z.string().optional(),
});

export type QuestRAGChatRequest = z.infer<typeof QuestRAGChatRequestSchema>;

export const QuestRAGChatResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  quest_id: z.number(),
  landmark: z.string().optional(),
  session_id: z.string(),
  audio: z.string().nullable().optional(),
  audio_url: z.string().nullable().optional(),
});

export type QuestRAGChatResponse = z.infer<typeof QuestRAGChatResponseSchema>;

// Route Recommend
export const RouteRecommendRequestSchema = z.object({
  preferences: z
    .object({
      includeCart: z.boolean().optional(),
      theme: z.union([z.string(), z.array(z.string())]).optional(),
      category: z.string().optional(),
      districts: z.array(z.string()).optional(),
    })
    .catchall(z.any()),
  must_visit_place_id: z.string().optional(),
  must_visit_quest_id: z.number().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  start_latitude: z.number().optional(),
  start_longitude: z.number().optional(),
  radius_km: z.number().optional(),
});

export type RouteRecommendRequest = z.infer<typeof RouteRecommendRequestSchema>;

export const RouteRecommendResponseSchema = z.object({
  success: z.boolean(),
  quests: z.array(QuestSchema),
  count: z.number(),
  session_id: z.string(),
});

export type RouteRecommendResponse = z.infer<typeof RouteRecommendResponseSchema>;

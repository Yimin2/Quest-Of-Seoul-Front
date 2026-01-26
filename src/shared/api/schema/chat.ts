import { z } from 'zod';

export const ChatMessageSchema = z.object({
  id: z.number(),
  user_message: z.string(),
  ai_response: z.string(),
  image_url: z.string().optional(),
  created_at: z.string(),
  landmark: z.string().optional(),
  title: z.string().optional(),
  selected_theme: z.string().optional(),
  selected_districts: z.array(z.string()).optional(),
  include_cart: z.boolean().optional(),
  quest_step: z.number().optional(),
  prompt_step_text: z.string().optional(),
  options: z.any().optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export const ChatSessionSchema = z.object({
  session_id: z.string(),
  function_type: z.enum(['rag_chat', 'vlm_chat', 'route_recommend']),
  mode: z.enum(['explore', 'quest']),
  title: z.string(),
  is_read_only: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
  time_ago: z.string(),
  chats: z.array(ChatMessageSchema),
});

export type ChatSession = z.infer<typeof ChatSessionSchema>;

export const ChatListResponseSchema = z.object({
  success: z.boolean(),
  sessions: z.array(ChatSessionSchema),
  count: z.number(),
});

export type ChatListResponse = z.infer<typeof ChatListResponseSchema>;

export const ChatSessionResponseSchema = z.object({
  success: z.boolean(),
  session: z.object({
    session_id: z.string(),
    function_type: z.string(),
    mode: z.string(),
    title: z.string(),
    is_read_only: z.boolean(),
    created_at: z.string(),
  }),
  chats: z.array(ChatMessageSchema),
  count: z.number(),
});

export type ChatSessionResponse = z.infer<typeof ChatSessionResponseSchema>;

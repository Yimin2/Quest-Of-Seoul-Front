import { useAuthStore } from '@entities/user';
import { apiRequest, API_URL, logApiTrace } from './base';
import { fromZodError } from 'zod-validation-error';
import {
  ChatListResponseSchema,
  ChatSessionResponseSchema,
  DocentChatResponseSchema,
  VLMAnalyzeResponseSchema,
  SimilarPlacesResponseSchema,
  STTTTSResponseSchema,
  ExploreRAGChatResponseSchema,
  QuestRAGChatResponseSchema,
  RouteRecommendResponseSchema,
  QuestVLMChatResponseSchema,
  type ChatListResponse,
  type ChatSessionResponse,
  type DocentChatRequest,
  type DocentChatResponse,
  type VLMAnalyzeRequest,
  type VLMAnalyzeResponse,
  type SimilarPlacesRequest,
  type SimilarPlacesResponse,
  type STTTTSRequest,
  type STTTTSResponse,
  type ExploreRAGChatRequest,
  type ExploreRAGChatResponse,
  type QuestRAGChatRequest,
  type QuestRAGChatResponse,
  type RouteRecommendRequest,
  type RouteRecommendResponse,
  type QuestVLMChatRequest,
  type QuestVLMChatResponse,
} from './schema';



export const aiStationApi = {
  async docentChat(request: DocentChatRequest): Promise<DocentChatResponse> {
    const data = await apiRequest<unknown>('/docent/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    const result = DocentChatResponseSchema.safeParse(data);

    if (!result.success) {
      const validationError = fromZodError(result.error);
      console.error('DocentChat Validation Error:', validationError.toString());
      throw validationError;
    }

    return result.data;
  },

  async vlmAnalyze(request: VLMAnalyzeRequest): Promise<VLMAnalyzeResponse> {
    const data = await apiRequest<unknown>('/vlm/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    const result = VLMAnalyzeResponseSchema.safeParse(data);

    if (!result.success) {
      const validationError = fromZodError(result.error);
      console.error('VLMAnalyze Validation Error:', validationError.toString());
      throw validationError;
    }

    return result.data;
  },

  async similarPlaces(request: SimilarPlacesRequest): Promise<SimilarPlacesResponse> {
    const data = await apiRequest<unknown>('/recommend/similar-places', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    const result = SimilarPlacesResponseSchema.safeParse(data);

    if (!result.success) {
      const validationError = fromZodError(result.error);
      console.error('SimilarPlaces Validation Error:', validationError.toString());
      throw validationError;
    }

    return result.data;
  },

  async sttTts(request: STTTTSRequest): Promise<STTTTSResponse> {
    const token = useAuthStore.getState().token;

    const startTime = performance.now();
    const response = await fetch(`${API_URL}/ai-station/stt-tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
    });

    const data = await response.json().catch(() => null);
    logApiTrace('POST', '/ai-station/stt-tts', startTime);

    if (!response.ok && response.status === 400) {
      if (data?.transcribed_text && data.transcribed_text.trim().length > 0) {
        return {
          success: false,
          transcribed_text: data.transcribed_text,
          audio: undefined,
          audio_url: null,
        };
      }
      const errorMessage =
        data?.detail || data?.error || `STT transcription failed: ${response.status}`;
      throw new Error(errorMessage);
    }

    if (response.status === 401) {
      try {
        await useAuthStore.getState().refreshToken();
        const newToken = useAuthStore.getState().token;
        if (newToken) {
          const retryStartTime = performance.now();
          const retryResponse = await fetch(`${API_URL}/ai-station/stt-tts`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${newToken}`,
            },
            body: JSON.stringify(request),
          });

          if (!retryResponse.ok) {
            logApiTrace('POST', '/ai-station/stt-tts', retryStartTime);
            const retryData = await retryResponse.json().catch(() => null);
            throw new Error(retryData?.detail || `HTTP error! status: ${retryResponse.status}`);
          }
          const retryData = await retryResponse.json().catch(() => null);
          logApiTrace('POST', '/ai-station/stt-tts', retryStartTime);
          
          const retryResult = STTTTSResponseSchema.safeParse(retryData);
          if (!retryResult.success) {
              // Retry success but validation failed
               const validationError = fromZodError(retryResult.error);
               console.error('STTTTS (Retry) Validation Error:', validationError.toString());
               throw validationError;
          }
          return retryResult.data;
        }
      } catch (refreshError) {
        await useAuthStore.getState().clearAuth();
        throw new Error('Authentication failed. Please login again.');
      }
    }

    if (!response.ok) {
      throw new Error(data?.detail || `HTTP error! status: ${response.status}`);
    }

    const result = STTTTSResponseSchema.safeParse(data);

     if (!result.success) {
      const validationError = fromZodError(result.error);
      console.error('STTTTS Validation Error:', validationError.toString());
      throw validationError;
    }

    return result.data;
  },

  async exploreRAGChat(request: ExploreRAGChatRequest): Promise<ExploreRAGChatResponse> {
    const data = await apiRequest<unknown>('/ai-station/explore/rag-chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    const result = ExploreRAGChatResponseSchema.safeParse(data);

    if (!result.success) {
      const validationError = fromZodError(result.error);
      console.error('ExploreRAGChat Validation Error:', validationError.toString());
      throw validationError;
    }

    return result.data;
  },

  async questRAGChat(request: QuestRAGChatRequest): Promise<QuestRAGChatResponse> {
    const data = await apiRequest<unknown>('/ai-station/quest/rag-chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    const result = QuestRAGChatResponseSchema.safeParse(data);

    if (!result.success) {
      const validationError = fromZodError(result.error);
      console.error('QuestRAGChat Validation Error:', validationError.toString());
      throw validationError;
    }

    return result.data;
  },

  async routeRecommend(request: RouteRecommendRequest): Promise<RouteRecommendResponse> {
    const data = await apiRequest<unknown>('/ai-station/route-recommend', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    const result = RouteRecommendResponseSchema.safeParse(data);

    if (!result.success) {
      const validationError = fromZodError(result.error);
      console.error('RouteRecommend Validation Error:', validationError.toString());
      throw validationError;
    }

    return result.data;
  },

  async getChatList(params?: {
    limit?: number;
    mode?: 'explore' | 'quest';
    function_type?: 'rag_chat' | 'vlm_chat' | 'route_recommend';
  }): Promise<ChatListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.mode) queryParams.append('mode', params.mode);
    if (params?.function_type) queryParams.append('function_type', params.function_type);

    const queryString = queryParams.toString();
    const endpoint = `/ai-station/chat-list${queryString ? `?${queryString}` : ''}`;

    const data = await apiRequest<unknown>(endpoint, {
      method: 'GET',
    });

    const result = ChatListResponseSchema.safeParse(data);

    if (!result.success) {
      const validationError = fromZodError(result.error);
      console.error('ChatList Validation Error:', validationError.toString());
      throw validationError;
    }

    return result.data;
  },

  async getChatSession(sessionId: string): Promise<ChatSessionResponse> {
    const data = await apiRequest<unknown>(`/ai-station/chat-session/${sessionId}`, {
      method: 'GET',
    });

    const result = ChatSessionResponseSchema.safeParse(data);

    if (!result.success) {
      const validationError = fromZodError(result.error);
      console.error('ChatSession Validation Error:', validationError.toString());
      throw validationError;
    }

    return result.data;
  },

  async questVlmChat(request: QuestVLMChatRequest): Promise<QuestVLMChatResponse> {
    const data = await apiRequest<unknown>('/ai-station/quest/vlm-chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    const result = QuestVLMChatResponseSchema.safeParse(data);

    if (!result.success) {
      const validationError = fromZodError(result.error);
      console.error('QuestVLMChat Validation Error:', validationError.toString());
      throw validationError;
    }

    return result.data;
  },
};

export const routeRecommendApi = {
  async routeRecommend(request: RouteRecommendRequest): Promise<RouteRecommendResponse> {
    return aiStationApi.routeRecommend(request);
  },
};

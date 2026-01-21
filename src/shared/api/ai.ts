import { useAuthStore } from '@entities/user';
import { apiRequest, API_URL, logApiTrace } from './base';
import type { Quest } from './quest';

// Docent Chat
export interface DocentChatRequest {
  landmark: string;
  user_message: string;
  language?: string;
  prefer_url?: boolean;
  enable_tts?: boolean;
  quest_id?: number;
  place_id?: string;
}

export interface DocentChatResponse {
  message: string;
  landmark: string;
  audio?: string | null;
  audio_url?: string | null;
}

// VLM Analyze
export interface VLMAnalyzeRequest {
  image: string;
  latitude?: number;
  longitude?: number;
  language?: string;
  prefer_url?: boolean;
  enable_tts?: boolean;
  use_cache?: boolean;
}

export interface VLMAnalyzeResponse {
  success: boolean;
  description: string;
  place?: {
    id: string;
    name: string;
    category: string;
    address: string;
  };
  vlm_analysis?: string;
  similar_places?: {
    place_id: string;
    similarity: number;
    image_url: string;
  }[];
  confidence_score?: number;
  processing_time_ms?: number;
  vlm_provider?: string;
  audio_url?: string;
}

// Quest VLM Chat
export interface QuestVLMChatRequest {
  image: string;
  user_message?: string;
  quest_id: number;
  place_id?: string;
  chat_session_id?: string;
  language?: string;
  prefer_url?: boolean;
  enable_tts?: boolean;
}

export interface QuestVLMChatResponse {
  success: boolean;
  message: string;
  place?: {
    id: string;
    name: string;
    category: string;
    address: string;
  };
  image_url?: string;
  audio?: string;
  audio_url?: string;
  session_id: string;
  quest_id: number;
}

// Similar Places
export interface SimilarPlacesRequest {
  image: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  limit?: number;
  quest_only?: boolean;
}

export interface SimilarPlacesResponse {
  success: boolean;
  count: number;
  recommendations: {
    quest_id?: number;
    place_id: string;
    similarity: number;
    name: string;
    description: string;
    category: string;
    latitude: number;
    longitude: number;
    reward_point: number;
    district?: string;
    place_image_url?: string;
    distance_km?: number;
    place?: {
      id: string;
      name: string;
      category: string;
    };
  }[];
  filter?: {
    gps_enabled: boolean;
    radius_km: number;
    quest_only: boolean;
  };
}

// STT + TTS
export interface STTTTSRequest {
  audio: string;
  language_code?: string;
  prefer_url?: boolean;
}

export interface STTTTSResponse {
  success: boolean;
  transcribed_text: string;
  audio_url?: string | null;
  audio?: string;
}

// Explore RAG Chat
export interface ExploreRAGChatRequest {
  user_message: string;
  language?: string;
  prefer_url?: boolean;
  enable_tts?: boolean;
  chat_session_id?: string;
}

export interface ExploreRAGChatResponse {
  success: boolean;
  message: string;
  session_id: string;
  audio?: string | null;
  audio_url?: string | null;
}

// Quest RAG Chat
export interface QuestRAGChatRequest {
  quest_id: number;
  user_message: string;
  language?: string;
  prefer_url?: boolean;
  enable_tts?: boolean;
  chat_session_id?: string;
}

export interface QuestRAGChatResponse {
  success: boolean;
  message: string;
  quest_id: number;
  landmark?: string;
  session_id: string;
  audio?: string | null;
  audio_url?: string | null;
}

// Route Recommend
export interface RouteRecommendRequest {
  preferences: {
    includeCart?: boolean;
    theme?: string | string[];
    category?: string;
    districts?: string[];
    [key: string]: any;
  };
  must_visit_place_id?: string;
  must_visit_quest_id?: number;
  latitude?: number;
  longitude?: number;
  start_latitude?: number;
  start_longitude?: number;
  radius_km?: number;
}

export interface RouteRecommendResponse {
  success: boolean;
  quests: Quest[];
  count: number;
  session_id: string;
}

// Chat History
export interface ChatMessage {
  id: number;
  user_message: string;
  ai_response: string;
  image_url?: string;
  created_at: string;
  landmark?: string;
  title?: string;
  selected_theme?: string;
  selected_districts?: string[];
  include_cart?: boolean;
  quest_step?: number;
  prompt_step_text?: string;
  options?: any;
}

export interface ChatSession {
  session_id: string;
  function_type: 'rag_chat' | 'vlm_chat' | 'route_recommend';
  mode: 'explore' | 'quest';
  title: string;
  is_read_only: boolean;
  created_at: string;
  updated_at: string;
  time_ago: string;
  chats: ChatMessage[];
}

export interface ChatListResponse {
  success: boolean;
  sessions: ChatSession[];
  count: number;
}

export interface ChatSessionResponse {
  success: boolean;
  session: {
    session_id: string;
    function_type: string;
    mode: string;
    title: string;
    is_read_only: boolean;
    created_at: string;
  };
  chats: ChatMessage[];
  count: number;
}

export const aiStationApi = {
  async docentChat(request: DocentChatRequest): Promise<DocentChatResponse> {
    return apiRequest<DocentChatResponse>('/docent/chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async vlmAnalyze(request: VLMAnalyzeRequest): Promise<VLMAnalyzeResponse> {
    return apiRequest<VLMAnalyzeResponse>('/vlm/analyze', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async similarPlaces(request: SimilarPlacesRequest): Promise<SimilarPlacesResponse> {
    return apiRequest<SimilarPlacesResponse>('/recommend/similar-places', {
      method: 'POST',
      body: JSON.stringify(request),
    });
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
          return retryData;
        }
      } catch (refreshError) {
        await useAuthStore.getState().logout();
        throw new Error('Authentication failed. Please login again.');
      }
    }

    if (!response.ok) {
      throw new Error(data?.detail || `HTTP error! status: ${response.status}`);
    }

    return data as STTTTSResponse;
  },

  async exploreRAGChat(request: ExploreRAGChatRequest): Promise<ExploreRAGChatResponse> {
    return apiRequest<ExploreRAGChatResponse>('/ai-station/explore/rag-chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async questRAGChat(request: QuestRAGChatRequest): Promise<QuestRAGChatResponse> {
    return apiRequest<QuestRAGChatResponse>('/ai-station/quest/rag-chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },

  async routeRecommend(request: RouteRecommendRequest): Promise<RouteRecommendResponse> {
    return apiRequest<RouteRecommendResponse>('/ai-station/route-recommend', {
      method: 'POST',
      body: JSON.stringify(request),
    });
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

    return apiRequest<ChatListResponse>(endpoint, {
      method: 'GET',
    });
  },

  async getChatSession(sessionId: string): Promise<ChatSessionResponse> {
    return apiRequest<ChatSessionResponse>(`/ai-station/chat-session/${sessionId}`, {
      method: 'GET',
    });
  },

  async questVlmChat(request: QuestVLMChatRequest): Promise<QuestVLMChatResponse> {
    return apiRequest<QuestVLMChatResponse>('/ai-station/quest/vlm-chat', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },
};

export const routeRecommendApi = {
  async routeRecommend(request: RouteRecommendRequest): Promise<RouteRecommendResponse> {
    return apiRequest<RouteRecommendResponse>('/ai-station/route-recommend', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },
};

import { useAuthStore } from "@/store/useAuthStore";
import Constants from "expo-constants";
import { Platform } from "react-native";

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  (Platform.OS === "android"
    ? "http://10.0.2.2:8000"
    : "http://localhost:8000");

// API 성능 측정을 위한 경량 로깅 함수
const logApiTrace = (method: string, endpoint: string, startTime: number) => {
  if (__DEV__) {
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
    const duration = (performance.now() - startTime).toFixed(2);
    console.log(
      `🚀 [API] [${timestamp}] ${method} ${endpoint} | ${duration}ms`,
    );
  }
};

// API 요청 헬퍼 함수 - Authorization 헤더 자동 추가
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // 토큰이 있으면 Authorization 헤더 추가
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Content-Type이 설정되지 않았고 body가 있으면 기본값 설정
  if (options.body && !headers["Content-Type"]) {
    if (options.body instanceof FormData) {
      // FormData는 Content-Type을 설정하지 않음 (브라우저가 자동 설정)
    } else {
      headers["Content-Type"] = "application/json";
    }
  }

  const startTime = performance.now();
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: headers as HeadersInit,
  });

  // 401 에러 처리 - 토큰 갱신 시도
  if (response.status === 401) {
    try {
      await useAuthStore.getState().refreshToken();
      // 토큰 갱신 후 재시도
      const newToken = useAuthStore.getState().token;
      if (newToken) {
        headers["Authorization"] = `Bearer ${newToken}`;
        const retryStartTime = performance.now();
        const retryResponse = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers: headers as HeadersInit,
        });
        if (!retryResponse.ok) {
          logApiTrace(options.method || "GET", endpoint, retryStartTime);
          throw new Error(`HTTP error! status: ${retryResponse.status}`);
        }
        const retryData = await retryResponse.json();
        logApiTrace(options.method || "GET", endpoint, retryStartTime);
        return retryData;
      }
    } catch (refreshError) {
      // 토큰 갱신 실패 시 로그아웃 처리
      await useAuthStore.getState().logout();
      throw new Error("Authentication failed. Please login again.");
    }
  }

  if (!response.ok) {
    logApiTrace(options.method || "GET", endpoint, startTime);
    const error = await response
      .json()
      .catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  logApiTrace(options.method || "GET", endpoint, startTime);
  return data;
}

export interface Quest {
  id: number;
  place_id: string | null;
  name: string;
  title: string | null;
  description: string;
  category: string | null;
  latitude: number;
  longitude: number;
  reward_point: number;
  points: number;
  difficulty: "easy" | "medium" | "hard";
  is_active: boolean;
  completion_count: number;
  created_at: string;
  district?: string;
  place_image_url?: string;
  distance_km?: number;
}

export interface QuestListResponse {
  quests: Quest[];
}

export interface FilterRequest {
  categories?: string[];
  districts?: string[];
  sort_by?: "nearest" | "rewarded" | "newest";
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  limit?: number;
}

export interface FilterResponse {
  success: boolean;
  count: number;
  quests: Quest[];
  filters_applied: {
    categories: string[];
    districts: string[];
    sort_by: string;
  };
}

export interface SearchRequest {
  query: string;
  latitude?: number;
  longitude?: number;
  radius_km?: number;
  limit?: number;
}

export interface SearchResponse {
  success: boolean;
  count: number;
  quests: Quest[];
}

export interface QuestDetailResponse {
  quest: Quest;
  user_status?: {
    status: string;
    started_at: string;
    completed_at?: string;
  } | null;
  user_points?: number;
}

export interface QuestStartRequest {
  quest_id: number;
  latitude?: number;
  longitude?: number;
  start_latitude?: number;
  start_longitude?: number;
  place_id?: string; // Optional, 백엔드에서 사용하지 않지만 호환성을 위해 포함
}

export interface QuestStartResponse {
  quest: Quest;
  place?: {
    id: string;
    name: string;
    category: string;
    address: string;
  } | null;
  status: string;
  place_id?: string | null;
  message: string;
}

export const questApi = {
  async getQuestDetail(questId: number): Promise<QuestDetailResponse> {
    try {
      const data: QuestDetailResponse = await apiRequest<QuestDetailResponse>(
        `/quest/${questId}`,
        {
          method: "GET",
        },
      );
      return data;
    } catch (error) {
      if (
        error instanceof TypeError &&
        error.message.includes("Network request failed")
      ) {
        throw new Error(
          "Unable to connect to server. Please check if the API server is running.",
        );
      }
      throw error;
    }
  },

  async getQuestList(): Promise<Quest[]> {
    try {
      const data: QuestListResponse = await apiRequest<QuestListResponse>(
        "/quest/list",
        {
          method: "GET",
        },
      );
      return data.quests;
    } catch (error) {
      if (
        error instanceof TypeError &&
        error.message.includes("Network request failed")
      ) {
        throw new Error(
          "Unable to connect to server. Please check if the API server is running.",
        );
      }
      throw error;
    }
  },

  async getFilteredQuests(
    filterParams: FilterRequest,
  ): Promise<FilterResponse> {
    try {
      const data: FilterResponse = await apiRequest<FilterResponse>(
        "/map/filter",
        {
          method: "POST",
          body: JSON.stringify(filterParams),
        },
      );
      return data;
    } catch (error) {
      if (
        error instanceof TypeError &&
        error.message.includes("Network request failed")
      ) {
        throw new Error(
          "Unable to connect to server. Please check if the API server is running.",
        );
      }
      throw error;
    }
  },

  async searchQuests(searchParams: SearchRequest): Promise<SearchResponse> {
    try {
      const data: SearchResponse = await apiRequest<SearchResponse>(
        "/map/search",
        {
          method: "POST",
          body: JSON.stringify(searchParams),
        },
      );
      return data;
    } catch (error) {
      if (
        error instanceof TypeError &&
        error.message.includes("Network request failed")
      ) {
        throw new Error(
          "Unable to connect to server. Please check if the API server is running.",
        );
      }
      throw error;
    }
  },

  async startQuest(request: QuestStartRequest): Promise<QuestStartResponse> {
    try {
      const { place_id, ...requestBody } = request;
      const data: QuestStartResponse = await apiRequest<QuestStartResponse>(
        "/quest/start",
        {
          method: "POST",
          body: JSON.stringify(requestBody),
        },
      );
      return data;
    } catch (error) {
      if (
        error instanceof TypeError &&
        error.message.includes("Network request failed")
      ) {
        throw new Error(
          "Unable to connect to server. Please check if the API server is running.",
        );
      }
      throw error;
    }
  },
};

export interface QuizResponse {
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

export interface QuizItem {
  id: number;
  place: string;
  question: string;
  choices: string[];
  answer: string;
  description: string;
  hint: string;
  difficulty?: string;
}

// Quest Quiz API interfaces
export interface QuestQuizResponse {
  quest: {
    id: number;
    name: string;
    reward_point: number;
  };
  quizzes: {
    id: number;
    question: string;
    options: string[];
    hint: string;
    difficulty: string;
    correct_answer?: number;
  }[];
  count: number;
}

export interface QuizSubmitRequest {
  answer: number;
  is_last_quiz?: boolean;
}

export interface QuizSubmitResponse {
  success: boolean;
  is_correct: boolean;
  earned: number;
  total_score: number;
  retry_allowed: boolean;
  hint?: string;
  completed: boolean;
  points_awarded: number;
  already_completed: boolean;
  new_balance?: number;
  explanation?: string;
}

export const quizApi = {
  async getQuiz(
    landmark: string,
    language: string = "en",
  ): Promise<QuizResponse> {
    try {
      const data: QuizResponse = await apiRequest<QuizResponse>(
        `/docent/quiz?landmark=${encodeURIComponent(landmark)}&language=${language}`,
        {
          method: "POST",
        },
      );
      return data;
    } catch (error) {
      if (
        error instanceof TypeError &&
        error.message.includes("Network request failed")
      ) {
        throw new Error(
          "Unable to connect to server. Please check if the API server is running.",
        );
      }
      throw error;
    }
  },

  async getMultipleQuizzes(
    landmark: string,
    count: number = 5,
    language: string = "en",
  ): Promise<QuizItem[]> {
    try {
      const quizPromises = Array.from({ length: count }, () =>
        this.getQuiz(landmark, language),
      );

      const responses = await Promise.all(quizPromises);

      const quizItems: QuizItem[] = responses.map((response, index) => ({
        id: index + 1,
        place: landmark,
        question: response.question,
        choices: response.options,
        answer: response.options[response.correct_answer],
        description: response.explanation || "",
        hint: "Think carefully about this question!",
      }));

      return quizItems;
    } catch (error) {
      throw error;
    }
  },

  // Quest 전용 퀴즈 API
  async getQuestQuizzes(questId: number): Promise<QuestQuizResponse> {
    try {
      const data: QuestQuizResponse = await apiRequest<QuestQuizResponse>(
        `/quest/${questId}/quizzes`,
        {
          method: "GET",
        },
      );
      return data;
    } catch (error) {
      throw error;
    }
  },

  async submitQuestQuiz(
    questId: number,
    quizId: number,
    answer: number,
    isLastQuiz: boolean = false,
  ): Promise<QuizSubmitResponse> {
    try {
      const data: QuizSubmitResponse = await apiRequest<QuizSubmitResponse>(
        `/quest/${questId}/quizzes/${quizId}/submit`,
        {
          method: "POST",
          body: JSON.stringify({ answer, is_last_quiz: isLastQuiz }),
        },
      );
      return data;
    } catch (error) {
      throw error;
    }
  },

  // Quest 퀴즈를 QuizItem 형식으로 변환
  convertQuestQuizzesToItems(questQuizResponse: QuestQuizResponse): QuizItem[] {
    return questQuizResponse.quizzes.map((quiz) => ({
      id: quiz.id,
      place: questQuizResponse.quest.name,
      question: quiz.question,
      choices: quiz.options,
      answer:
        quiz.correct_answer !== undefined
          ? quiz.options[quiz.correct_answer]
          : quiz.options[0],
      description: "",
      hint: quiz.hint,
      difficulty: quiz.difficulty,
    }));
  },
};

// AI Station API
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

export interface VLMAnalyzeRequest {
  image: string;
  latitude?: number;
  longitude?: number;
  language?: string;
  prefer_url?: boolean;
  enable_tts?: boolean;
  use_cache?: boolean;
}

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

// Quest Mode RAG Chat Types
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

// Chat History Types
export interface ChatMessage {
  id: number;
  user_message: string;
  ai_response: string;
  image_url?: string;
  created_at: string;
  // AI PLUS Chat 전용 필드
  landmark?: string;
  // Plan Chat 전용 필드
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
  function_type: "rag_chat" | "vlm_chat" | "route_recommend";
  mode: "explore" | "quest";
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

// Points Types
export interface PointTransaction {
  id: number;
  user_id: string;
  value: number;
  reason: string;
  created_at: string;
}

export interface PointsResponse {
  total_points: number;
  transactions: PointTransaction[];
}

export const aiStationApi = {
  // Docent Chat (인증 필요)
  async docentChat(request: DocentChatRequest): Promise<DocentChatResponse> {
    return apiRequest<DocentChatResponse>("/docent/chat", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  // VLM Analyze (인증 필요)
  async vlmAnalyze(request: VLMAnalyzeRequest): Promise<VLMAnalyzeResponse> {
    return apiRequest<VLMAnalyzeResponse>("/vlm/analyze", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  // Similar Places (인증 필요)
  async similarPlaces(
    request: SimilarPlacesRequest,
  ): Promise<SimilarPlacesResponse> {
    return apiRequest<SimilarPlacesResponse>("/recommend/similar-places", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  // STT + TTS (인증 필요)
  async sttTts(request: STTTTSRequest): Promise<STTTTSResponse> {
    const token = useAuthStore.getState().token;

    const startTime = performance.now();
    const response = await fetch(`${API_URL}/ai-station/stt-tts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(request),
    });

    const data = await response.json().catch(() => null);
    logApiTrace("POST", "/ai-station/stt-tts", startTime);

    // 400 에러가 발생했지만 전사된 텍스트가 있으면 사용 (TTS 실패해도 STT 결과는 사용)
    if (!response.ok && response.status === 400) {
      if (data?.transcribed_text && data.transcribed_text.trim().length > 0) {
        return {
          success: false,
          transcribed_text: data.transcribed_text,
          audio: undefined,
          audio_url: null,
        };
      }
      // 전사된 텍스트도 없으면 에러 throw (백엔드에서 반환한 에러 메시지 사용)
      const errorMessage =
        data?.detail ||
        data?.error ||
        `STT transcription failed: ${response.status}`;
      throw new Error(errorMessage);
    }

    // 401 에러 처리 - 토큰 갱신 시도
    if (response.status === 401) {
      try {
        await useAuthStore.getState().refreshToken();
        const newToken = useAuthStore.getState().token;
        if (newToken) {
          const retryStartTime = performance.now();
          const retryResponse = await fetch(`${API_URL}/ai-station/stt-tts`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Authorization: `Bearer ${newToken}`,
            },
            body: JSON.stringify(request),
          });

          if (!retryResponse.ok) {
            logApiTrace("POST", "/ai-station/stt-tts", retryStartTime);
            const retryData = await retryResponse.json().catch(() => null);
            throw new Error(
              retryData?.detail ||
                `HTTP error! status: ${retryResponse.status}`,
            );
          }
          const retryData = await retryResponse.json().catch(() => null);
          logApiTrace("POST", "/ai-station/stt-tts", retryStartTime);
          return retryData;
        }
      } catch (refreshError) {
        await useAuthStore.getState().logout();
        throw new Error("Authentication failed. Please login again.");
      }
    }

    if (!response.ok) {
      throw new Error(data?.detail || `HTTP error! status: ${response.status}`);
    }

    return data as STTTTSResponse;
  },

  // Explore RAG Chat (인증 필요)
  async exploreRAGChat(
    request: ExploreRAGChatRequest,
  ): Promise<ExploreRAGChatResponse> {
    return apiRequest<ExploreRAGChatResponse>("/ai-station/explore/rag-chat", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  // Quest RAG Chat (인증 필요) - Quest Mode 텍스트/음성 채팅
  async questRAGChat(
    request: QuestRAGChatRequest,
  ): Promise<QuestRAGChatResponse> {
    return apiRequest<QuestRAGChatResponse>("/ai-station/quest/rag-chat", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  // Route Recommend (인증 필요)
  async routeRecommend(
    request: RouteRecommendRequest,
  ): Promise<RouteRecommendResponse> {
    return apiRequest<RouteRecommendResponse>("/ai-station/route-recommend", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  // Chat List (인증 필요)
  async getChatList(params?: {
    limit?: number;
    mode?: "explore" | "quest";
    function_type?: "rag_chat" | "vlm_chat" | "route_recommend";
  }): Promise<ChatListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.mode) queryParams.append("mode", params.mode);
    if (params?.function_type)
      queryParams.append("function_type", params.function_type);

    const queryString = queryParams.toString();
    const endpoint = `/ai-station/chat-list${queryString ? `?${queryString}` : ""}`;

    return apiRequest<ChatListResponse>(endpoint, {
      method: "GET",
    });
  },

  // Chat Session (인증 필요)
  async getChatSession(sessionId: string): Promise<ChatSessionResponse> {
    return apiRequest<ChatSessionResponse>(
      `/ai-station/chat-session/${sessionId}`,
      {
        method: "GET",
      },
    );
  },

  // Quest VLM Chat (인증 필요)
  async questVlmChat(
    request: QuestVLMChatRequest,
  ): Promise<QuestVLMChatResponse> {
    return apiRequest<QuestVLMChatResponse>("/ai-station/quest/vlm-chat", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },
};

// Route Recommend Types
export interface RouteRecommendRequest {
  preferences: {
    includeCart?: boolean;
    theme?: string | string[];
    category?: string;
    districts?: string[];
    [key: string]: any;
  };
  must_visit_place_id?: string;
  must_visit_quest_id?: number; // place_id가 없을 때 quest_id로 직접 지정
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

// Points API
export const pointsApi = {
  // Get user points (인증 필요)
  async getPoints(): Promise<PointsResponse> {
    return apiRequest<PointsResponse>("/reward/points", {
      method: "GET",
    });
  },
};

// Add route recommend to aiStationApi
export const routeRecommendApi = {
  // Route Recommend (인증 필요)
  async routeRecommend(
    request: RouteRecommendRequest,
  ): Promise<RouteRecommendResponse> {
    return apiRequest<RouteRecommendResponse>("/ai-station/route-recommend", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },
};

// Reward Shop API
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
  // Get rewards list with optional filters
  async getRewards(type?: string, search?: string): Promise<RewardsResponse> {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (search) params.append("search", search);

    const queryString = params.toString();
    const url = queryString ? `/reward/list?${queryString}` : "/reward/list";

    return apiRequest<RewardsResponse>(url, {
      method: "GET",
    });
  },

  // Claim a reward (purchase)
  async claim(reward_id: number): Promise<ClaimRewardResponse> {
    return apiRequest<ClaimRewardResponse>("/reward/claim", {
      method: "POST",
      body: JSON.stringify({ reward_id }),
    });
  },

  // Get claimed rewards (user's coupons)
  async getClaimedRewards(): Promise<ClaimedRewardsResponse> {
    return apiRequest<ClaimedRewardsResponse>("/reward/claimed", {
      method: "GET",
    });
  },

  // Use a reward (mark as used)
  async useReward(reward_id: number): Promise<UseRewardResponse> {
    return apiRequest<UseRewardResponse>(`/reward/use/${reward_id}`, {
      method: "POST",
    });
  },
};

// Map & Distance API
export interface WalkDistanceRequest {
  quest_ids: number[];
  user_latitude: number;
  user_longitude: number;
}

export interface WalkDistanceResponse {
  success: boolean;
  total_distance_km: number;
  route: {
    from: {
      type: string;
      quest_id?: number;
      name?: string;
      latitude?: number;
      longitude?: number;
    };
    to: {
      quest_id: number;
      name: string;
      latitude: number;
      longitude: number;
    };
    distance_km: number;
  }[];
}

export const mapApi = {
  // Calculate walk distance for a route
  async calculateWalkDistance(
    request: WalkDistanceRequest,
  ): Promise<WalkDistanceResponse> {
    return apiRequest<WalkDistanceResponse>("/map/stats/walk-distance", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },

  // Calculate distance between two points using Haversine formula
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) *
        Math.cos(phi2) *
        Math.sin(deltaLambda / 2) *
        Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in km
  },
};

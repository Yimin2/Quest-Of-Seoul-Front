import { apiRequest } from './base';

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
  difficulty: 'easy' | 'medium' | 'hard';
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
  sort_by?: 'nearest' | 'rewarded' | 'newest';
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
  place_id?: string;
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
      const data: QuestDetailResponse = await apiRequest<QuestDetailResponse>(`/quest/${questId}`, {
        method: 'GET',
      });
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Unable to connect to server. Please check if the API server is running.');
      }
      throw error;
    }
  },

  async getQuestList(): Promise<Quest[]> {
    try {
      const data: QuestListResponse = await apiRequest<QuestListResponse>('/quest/list', {
        method: 'GET',
      });
      return data.quests;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Unable to connect to server. Please check if the API server is running.');
      }
      throw error;
    }
  },

  async getFilteredQuests(filterParams: FilterRequest): Promise<FilterResponse> {
    try {
      const data: FilterResponse = await apiRequest<FilterResponse>('/map/filter', {
        method: 'POST',
        body: JSON.stringify(filterParams),
      });
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Unable to connect to server. Please check if the API server is running.');
      }
      throw error;
    }
  },

  async searchQuests(searchParams: SearchRequest): Promise<SearchResponse> {
    try {
      const data: SearchResponse = await apiRequest<SearchResponse>('/map/search', {
        method: 'POST',
        body: JSON.stringify(searchParams),
      });
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Unable to connect to server. Please check if the API server is running.');
      }
      throw error;
    }
  },

  async startQuest(request: QuestStartRequest): Promise<QuestStartResponse> {
    try {
      const { place_id, ...requestBody } = request;
      const data: QuestStartResponse = await apiRequest<QuestStartResponse>('/quest/start', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      return data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Unable to connect to server. Please check if the API server is running.');
      }
      throw error;
    }
  },
};

import { apiRequest } from './base';
import { fromZodError } from 'zod-validation-error';
import {
  QuestDetailResponseSchema,
  QuestListResponseSchema,
  FilterResponseSchema,
  SearchResponseSchema,
  QuestStartResponseSchema,
  type Quest,
  type QuestListResponse,
  type FilterRequest,
  type FilterResponse,
  type SearchRequest,
  type SearchResponse,
  type QuestDetailResponse,
  type QuestStartRequest,
  type QuestStartResponse,
} from './schema';

// Re-export types for backward compatibility
export type {
  Quest,
  QuestListResponse,
  FilterRequest,
  FilterResponse,
  SearchRequest,
  SearchResponse,
  QuestDetailResponse,
  QuestStartRequest,
  QuestStartResponse,
};

export const questApi = {
  async getQuestDetail(questId: number): Promise<QuestDetailResponse> {
    try {
      const data = await apiRequest<unknown>(`/quest/${questId}`, {
        method: 'GET',
      });
      
      const result = QuestDetailResponseSchema.safeParse(data);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.error('QuestDetail Validation Error:', validationError.toString());
        throw validationError;
      }
      
      return result.data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Unable to connect to server. Please check if the API server is running.');
      }
      throw error;
    }
  },

  async getQuestList(): Promise<Quest[]> {
    try {
      const data = await apiRequest<unknown>('/quest/list', {
        method: 'GET',
      });
      
      const result = QuestListResponseSchema.safeParse(data);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.error('QuestList Validation Error:', validationError.toString());
        throw validationError;
      }
      
      return result.data.quests;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Unable to connect to server. Please check if the API server is running.');
      }
      throw error;
    }
  },

  async getFilteredQuests(filterParams: FilterRequest): Promise<FilterResponse> {
    try {
      const data = await apiRequest<unknown>('/map/filter', {
        method: 'POST',
        body: JSON.stringify(filterParams),
      });
      
      const result = FilterResponseSchema.safeParse(data);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.error('FilterQuests Validation Error:', validationError.toString());
        throw validationError;
      }
      
      return result.data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Unable to connect to server. Please check if the API server is running.');
      }
      throw error;
    }
  },

  async searchQuests(searchParams: SearchRequest): Promise<SearchResponse> {
    try {
      const data = await apiRequest<unknown>('/map/search', {
        method: 'POST',
        body: JSON.stringify(searchParams),
      });
      
      const result = SearchResponseSchema.safeParse(data);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.error('SearchQuests Validation Error:', validationError.toString());
        throw validationError;
      }
      
      return result.data;
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
      const data = await apiRequest<unknown>('/quest/start', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      
      const result = QuestStartResponseSchema.safeParse(data);
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.error('StartQuest Validation Error:', validationError.toString());
        throw validationError;
      }
      
      return result.data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('Network request failed')) {
        throw new Error('Unable to connect to server. Please check if the API server is running.');
      }
      throw error;
    }
  },
};

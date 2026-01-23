import { FilterRequest } from './quest';

export const queryKeys = {
  // Points
  points: {
    all: ['points'] as const,
    detail: () => [...queryKeys.points.all, 'detail'] as const,
  },

  // Rewards
  rewards: {
    all: ['rewards'] as const,
    list: (type?: string, search?: string) =>
      [...queryKeys.rewards.all, 'list', { type, search }] as const,
    claimed: () => [...queryKeys.rewards.all, 'claimed'] as const,
  },

  // Quests
  quests: {
    all: ['quests'] as const,
    list: () => [...queryKeys.quests.all, 'list'] as const,
    detail: (id: number) => [...queryKeys.quests.all, 'detail', id] as const,
    filtered: (params: FilterRequest) => [...queryKeys.quests.all, 'filtered', params] as const,
  },

  // Map
  map: {
    all: ['map'] as const,
    search: (query: string) => [...queryKeys.map.all, 'search', query] as const,
  },

  // AI
  ai: {
    all: ['ai'] as const,
    list: (params?: any) => [...queryKeys.ai.all, 'list', params] as const,
    chat: (sessionId: string) => [...queryKeys.ai.all, 'chat', sessionId] as const,
  },

  // Quiz
  quiz: {
    all: ['quiz'] as const,
    byQuest: (questId: number) => [...queryKeys.quiz.all, 'quest', questId] as const,
  },
} as const;

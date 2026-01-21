import { create } from 'zustand';
import type { Quest } from '@/services/api';

interface ActiveQuest {
  quest_id: number;
  place_id: string | null;
  quest: Quest;
}

interface QuestStore {
  selectedQuests: Quest[];
  activeQuest: ActiveQuest | null;
  routeResults: Quest[] | null;
  addQuest: (quest: Quest) => void;
  removeQuest: (questId: number) => void;
  reorderQuests: (fromIndex: number, toIndex: number) => void;
  clearQuests: () => void;
  isQuestSelected: (questId: number) => boolean;
  startQuest: (quest: Quest) => void;
  endQuest: () => void;
  setRouteResults: (results: Quest[] | null) => void;
  clearRouteResults: () => void;
}

export const useQuestStore = create<QuestStore>((set, get) => ({
  selectedQuests: [],
  activeQuest: null,
  routeResults: null,

  addQuest: (quest: Quest) => {
    const { selectedQuests } = get();

    // 이미 선택된 퀘스트인지 확인
    if (selectedQuests.some(q => q.id === quest.id)) {
      return;
    }

    // 최대 4개까지만 선택 가능
    if (selectedQuests.length >= 4) {
      console.log('Maximum 4 quests can be selected');
      return;
    }

    set({ selectedQuests: [...selectedQuests, quest] });
  },

  removeQuest: (questId: number) => {
    set(state => ({
      selectedQuests: state.selectedQuests.filter(q => q.id !== questId)
    }));
  },

  reorderQuests: (fromIndex: number, toIndex: number) => {
    set(state => {
      const newQuests = [...state.selectedQuests];
      const [removed] = newQuests.splice(fromIndex, 1);
      newQuests.splice(toIndex, 0, removed);
      return { selectedQuests: newQuests };
    });
  },

  clearQuests: () => {
    set({ selectedQuests: [] });
  },

  isQuestSelected: (questId: number) => {
    return get().selectedQuests.some(q => q.id === questId);
  },

  startQuest: (quest: Quest) => {
    set({
      activeQuest: {
        quest_id: quest.id,
        place_id: quest.place_id,
        quest: quest,
      }
    });
  },

  endQuest: () => {
    console.log('endQuest called, clearing activeQuest');
    const currentState = get();
    console.log('Current activeQuest before clearing:', currentState.activeQuest);
    set({ activeQuest: null });
    const newState = get();
    console.log('activeQuest after clearing:', newState.activeQuest);
  },

  setRouteResults: (results: Quest[] | null) => {
    set({ routeResults: results });
  },

  clearRouteResults: () => {
    set({ routeResults: null });
  },
}));

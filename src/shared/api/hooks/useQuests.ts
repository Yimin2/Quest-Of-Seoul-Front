import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FilterRequest, questApi, QuestStartRequest } from '../quest';
import { queryKeys } from '../queryKeys';

// 퀘스트 목록 (전체)
export function useQuestList() {
  return useQuery({
    queryKey: queryKeys.quests.list(),
    queryFn: () => questApi.getQuestList(),
  });
}

// 퀘스트 상세
export function useQuestDetail(questId: number) {
  return useQuery({
    queryKey: queryKeys.quests.detail(questId),
    queryFn: () => questApi.getQuestDetail(questId),
    enabled: !!questId,
  });
}

// 필터링된 퀘스트 목록
export function useFilteredQuests(params: FilterRequest) {
  return useQuery({
    queryKey: queryKeys.quests.filtered(params),
    queryFn: () => questApi.getFilteredQuests(params),
    placeholderData: keepPreviousData, // 필터 변경 시 UI 깜빡임 방지
  });
}

// 퀘스트 시작 Mutation
export function useStartQuest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: QuestStartRequest) => questApi.startQuest(request),
    onSuccess: (_, variables) => {
      // 퀘스트 시작 성공 시 관련 쿼리 무효화 및 갱신
      queryClient.invalidateQueries({ queryKey: queryKeys.quests.detail(variables.quest_id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.quests.list() });
      // 진행 중인 퀘스트 목록 등 다른 영향받는 쿼리가 있다면 추가 무효화 필요
    },
  });
}

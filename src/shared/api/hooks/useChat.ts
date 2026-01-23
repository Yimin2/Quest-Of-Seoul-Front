import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiStationApi, type ChatSession } from '../..';
import { queryKeys } from '../queryKeys';

export function useChatList(params?: {
  limit?: number;
  mode?: 'explore' | 'quest';
  function_type?: 'rag_chat' | 'vlm_chat' | 'route_recommend';
}) {
  return useQuery({
    queryKey: queryKeys.ai.list(params),
    queryFn: () => aiStationApi.getChatList(params),
  });
}

export function useChatSession(sessionId: string) {
  return useQuery({
    queryKey: queryKeys.ai.chat(sessionId),
    queryFn: () => aiStationApi.getChatSession(sessionId),
    enabled: !!sessionId,
  });
}

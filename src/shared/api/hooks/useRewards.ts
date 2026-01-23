import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rewardApi } from '../reward';
import { queryKeys } from '../queryKeys';

// 리워드 목록 조회
export function useRewards(type?: string, search?: string) {
  return useQuery({
    queryKey: queryKeys.rewards.list(type, search),
    queryFn: () => rewardApi.getRewards(type, search),
  });
}

// 보유한 리워드(내 쿠폰함) 조회
export function useClaimedRewards() {
  return useQuery({
    queryKey: queryKeys.rewards.claimed(),
    queryFn: () => rewardApi.getClaimedRewards(),
  });
}

// 리워드 교환 (포인트 사용)
export function useClaimReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rewardId: number) => rewardApi.claim(rewardId),
    onSuccess: () => {
      // 리워드 획득 시 -> 내 쿠폰함 갱신 & 포인트 차감되므로 포인트 정보 갱신
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards.claimed() });
      queryClient.invalidateQueries({ queryKey: queryKeys.points.all });
    },
  });
}

// 리워드 사용 (쿠폰 사용 처리)
export function useUseReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rewardId: number) => rewardApi.useReward(rewardId),
    onSuccess: () => {
      // 사용 완료 시 -> 내 쿠폰함 갱신
      queryClient.invalidateQueries({ queryKey: queryKeys.rewards.claimed() });
    },
  });
}

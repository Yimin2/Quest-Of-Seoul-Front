import { useQuery } from '@tanstack/react-query';
import { pointsApi } from '../points';
import { queryKeys } from '../queryKeys';

// 포인트 상세 정보 조회
export function usePoints() {
  return useQuery({
    queryKey: queryKeys.points.detail(),
    queryFn: () => pointsApi.getPoints(),
    // 필요한 경우 select 옵션으로 total_points만 추출 가능
    // select: (data) => data.total_points,
  });
}

import { useAuthStore } from '@entities/user';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// 개발 환경 API URL
const DEV_API_URL =
  Constants.expoConfig?.extra?.apiUrl ||
  (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000');

// 프로덕션 환경 API URL (임시 주소, 나중에 실주소로 변경 필요)
const PROD_API_URL = 'https://api.questofseoul.com';

export const API_URL = __DEV__ ? DEV_API_URL : PROD_API_URL;

// API 성능 측정을 위한 경량 로깅 함수
export const logApiTrace = (method: string, endpoint: string, startTime: number) => {
  if (__DEV__) {
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const duration = (performance.now() - startTime).toFixed(2);
    console.log(`🚀 [API] [${timestamp}] ${method} ${endpoint} | ${duration}ms`);
  }
};

// API 요청 헬퍼 함수 - Authorization 헤더 자동 추가
export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  // 토큰이 있으면 Authorization 헤더 추가
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Content-Type이 설정되지 않았고 body가 있으면 기본값 설정
  if (options.body && !headers['Content-Type']) {
    if (options.body instanceof FormData) {
      // FormData는 Content-Type을 설정하지 않음 (브라우저가 자동 설정)
    } else {
      headers['Content-Type'] = 'application/json';
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
        headers['Authorization'] = `Bearer ${newToken}`;
        const retryStartTime = performance.now();
        const retryResponse = await fetch(`${API_URL}${endpoint}`, {
          ...options,
          headers: headers as HeadersInit,
        });
        if (!retryResponse.ok) {
          logApiTrace(options.method || 'GET', endpoint, retryStartTime);
          throw new Error(`HTTP error! status: ${retryResponse.status}`);
        }
        const retryData = await retryResponse.json();
        logApiTrace(options.method || 'GET', endpoint, retryStartTime);
        return retryData;
      }
    } catch (refreshError) {
      // 토큰 갱신 실패 시 로그아웃 처리
      await useAuthStore.getState().logout();
      throw new Error('Authentication failed. Please login again.');
    }
  }

  if (!response.ok) {
    logApiTrace(options.method || 'GET', endpoint, startTime);
    const error = await response
      .json()
      .catch(() => ({ detail: `HTTP error! status: ${response.status}` }));
    throw new Error(error.detail || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  logApiTrace(options.method || 'GET', endpoint, startTime);
  return data;
}

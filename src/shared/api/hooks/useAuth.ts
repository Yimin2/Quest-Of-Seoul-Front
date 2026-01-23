import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@entities/user';
import { API_URL } from '../base';

interface LoginRequest {
  email: string;
  password: string;
}
interface SignupRequest {
  email: string;
  password: string;
  nickname?: string;
}

// 로그인 Mutation
export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Login failed' }));
        throw new Error(error.detail || 'Login failed');
      }

      return res.json();
    },
    onSuccess: (data) => {
      // API 응답 구조에 맞게 매핑 필요하다면 여기서 처리
      setAuth(data);
    },
  });
}

// 회원가입 Mutation
export function useSignup() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: SignupRequest) => {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({ detail: 'Signup failed' }));
        throw new Error(error.detail || 'Signup failed');
      }

      return res.json();
    },
    onSuccess: (data) => setAuth(data),
  });
}

// 로그아웃 Mutation
export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useMutation({
    mutationFn: async () => {
      // 서버 로그아웃 필요하면 여기서 호출
      return clearAuth();
    },
  });
}

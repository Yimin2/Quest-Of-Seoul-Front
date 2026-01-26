import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@entities/user';
import { authApi, type LoginRequest, type SignupRequest } from '../auth';

// 로그인 Mutation
export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: LoginRequest) => {
      const result = await authApi.login(data);
      return result;
    },
    onSuccess: (data) => {
      setAuth(data);
    },
  });
}

// 회원가입 Mutation
export function useSignup() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: async (data: SignupRequest) => {
      const result = await authApi.signup(data);
      return result;
    },
    onSuccess: (data) => setAuth(data),
  });
}

// 로그아웃 Mutation
export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);

  return useMutation({
    mutationFn: async () => {
      return clearAuth();
    },
  });
}

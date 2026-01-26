import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { authApi } from '../../../shared/api/auth';

const TOKEN_KEY = 'access_token';
const USER_ID_KEY = 'user_id';
const USER_EMAIL_KEY = 'user_email';
const USER_NICKNAME_KEY = 'user_nickname';
const GUEST_MODE_KEY = 'is_guest_mode';

export interface User {
  user_id: string;
  email: string;
  nickname?: string;
}

interface AuthData {
  access_token: string;
  user_id: string;
  email: string;
  nickname?: string;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isGuest: boolean;

  // Actions
  setAuth: (data: AuthData) => Promise<void>;
  clearAuth: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  refreshToken: () => Promise<void>;
  loadStoredAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isGuest: false,

  loadStoredAuth: async () => {
    try {
      const [token, userId, email, nickname, isGuestMode] = await Promise.all([
        AsyncStorage.getItem(TOKEN_KEY),
        AsyncStorage.getItem(USER_ID_KEY),
        AsyncStorage.getItem(USER_EMAIL_KEY),
        AsyncStorage.getItem(USER_NICKNAME_KEY),
        AsyncStorage.getItem(GUEST_MODE_KEY),
      ]);

      // 게스트 모드 체크
      if (isGuestMode === 'true') {
        set({
          token: 'guest_token',
          user: {
            user_id: 'guest',
            email: 'guest@questofseoul.com',
            nickname: 'Guest',
          },
          isAuthenticated: true,
          isGuest: true,
          isLoading: false,
        });
      } else if (token && userId) {
        set({
          token,
          user: {
            user_id: userId,
            email: email || '',
            nickname: nickname || undefined,
          },
          isAuthenticated: true,
          isGuest: false,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      set({ isLoading: false });
    }
  },

  setAuth: async (data: AuthData) => {
    try {
      // 토큰 및 사용자 정보 저장
      await Promise.all([
        AsyncStorage.setItem(TOKEN_KEY, data.access_token),
        AsyncStorage.setItem(USER_ID_KEY, data.user_id),
        AsyncStorage.setItem(USER_EMAIL_KEY, data.email),
        data.nickname && AsyncStorage.setItem(USER_NICKNAME_KEY, data.nickname),
        AsyncStorage.removeItem(GUEST_MODE_KEY), // 게스트 모드 해제
      ]);

      set({
        token: data.access_token,
        user: {
          user_id: data.user_id,
          email: data.email,
          nickname: data.nickname,
        },
        isAuthenticated: true,
        isGuest: false,
      });
    } catch (error) {
      console.error('Set auth error:', error);
      throw error;
    }
  },

  clearAuth: async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(TOKEN_KEY),
        AsyncStorage.removeItem(USER_ID_KEY),
        AsyncStorage.removeItem(USER_EMAIL_KEY),
        AsyncStorage.removeItem(USER_NICKNAME_KEY),
        AsyncStorage.removeItem(GUEST_MODE_KEY),
      ]);

      set({
        token: null,
        user: null,
        isAuthenticated: false,
        isGuest: false,
      });
    } catch (error) {
      console.error('Clear auth error:', error);
    }
  },

  loginAsGuest: async () => {
    try {
      // 게스트 모드 저장
      await AsyncStorage.setItem(GUEST_MODE_KEY, 'true');

      set({
        token: 'guest_token',
        user: {
          user_id: 'guest',
          email: 'guest@questofseoul.com',
          nickname: '게스트',
        },
        isAuthenticated: true,
        isGuest: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Guest login error:', error);
      throw error;
    }
  },

  refreshToken: async () => {
    const { token } = get();
    if (!token) return;

    try {
      const data = await authApi.refresh(token);
      
      await AsyncStorage.setItem(TOKEN_KEY, data.access_token);
      set({ token: data.access_token });
    } catch (error) {
      console.error('Token refresh error:', error);
      await get().clearAuth(); // 로그아웃 처리
    }
  },
}));

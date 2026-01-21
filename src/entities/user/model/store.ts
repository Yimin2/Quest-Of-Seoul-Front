import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { create } from 'zustand';

const API_URL = Constants.expoConfig?.extra?.apiUrl || (Platform.OS === 'android' ? 'http://10.0.2.2:8000' : 'http://localhost:8000');

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

interface AuthStore {
    token: string | null;
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isGuest: boolean;

    // Actions
    login: (email: string, password: string) => Promise<void>;
    loginAsGuest: () => Promise<void>;
    signup: (email: string, password: string, nickname?: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    loadStoredAuth: () => Promise<void>;
    getCurrentUser: () => Promise<User | null>;
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
            });
        } catch (error) {
            console.error('Guest login error:', error);
            throw error;
        }
    },

    login: async (email: string, password: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: 'Login failed' }));
                throw new Error(error.detail || 'Login failed');
            }

            const data = await response.json();

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
            console.error('Login error:', error);
            throw error;
        }
    },

    signup: async (email: string, password: string, nickname?: string) => {
        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password, nickname }),
            });

            if (!response.ok) {
                const error = await response.json().catch(() => ({ detail: 'Signup failed' }));
                throw new Error(error.detail || 'Signup failed');
            }

            const data = await response.json();

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
            console.error('Signup error:', error);
            throw error;
        }
    },

    logout: async () => {
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
            console.error('Logout error:', error);
        }
    },

    refreshToken: async () => {
        const { token } = get();
        if (!token) {
            throw new Error('No token to refresh');
        }

        try {
            const response = await fetch(`${API_URL}/auth/refresh`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();

            await AsyncStorage.setItem(TOKEN_KEY, data.access_token);

            set({ token: data.access_token });
        } catch (error) {
            console.error('Token refresh error:', error);
            // 토큰 갱신 실패 시 로그아웃
            await get().logout();
            throw error;
        }
    },

    getCurrentUser: async () => {
        const { token } = get();
        if (!token) {
            return null;
        }

        try {
            const response = await fetch(`${API_URL}/auth/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // 토큰 만료 시 갱신 시도
                    await get().refreshToken();
                    return get().user;
                }
                throw new Error('Failed to get current user');
            }

            const user = await response.json();

            // 사용자 정보 업데이트
            await Promise.all([
                AsyncStorage.setItem(USER_ID_KEY, user.user_id),
                AsyncStorage.setItem(USER_EMAIL_KEY, user.email),
                user.nickname && AsyncStorage.setItem(USER_NICKNAME_KEY, user.nickname),
            ]);

            set({
                user: {
                    user_id: user.user_id,
                    email: user.email,
                    nickname: user.nickname,
                },
            });

            return user;
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    },
}));


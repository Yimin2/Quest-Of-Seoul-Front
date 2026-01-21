import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { useRouter, useSegments } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useAuthStore } from '@entities/user';
import { useColorScheme } from '@shared/lib';

// 폰트 로딩 중 스플래시 화면 유지
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const { loadStoredAuth, isAuthenticated, isLoading } = useAuthStore();

  const [fontsLoaded, fontError] = useFonts({
    'BagelFatOne-Regular': require('../assets/fonts/BagelFatOne-Regular.ttf'),
  });

  useEffect(() => {
    // 앱 시작 시 저장된 인증 정보 로드
    loadStoredAuth();
  }, [loadStoredAuth]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // 인증 상태가 로드된 후에만 라우팅 처리
    if (isLoading) return;

    const inAuthGroup = segments[0] === 'login' || segments[0] === 'signup';

    if (!isAuthenticated && !inAuthGroup) {
      // 인증되지 않았고 로그인/회원가입 화면이 아니면 로그인 화면으로 이동
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      // 인증되었고 로그인/회원가입 화면이면 메인 화면으로 이동
      router.replace('/(tabs)/map');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Drawer
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            backgroundColor: '#111',
            width: 280,
          },
        }}
      >
        <Drawer.Screen
          name="(tabs)"
          options={{
            drawerItemStyle: { display: 'none' },
          }}
        />
        <Drawer.Screen
          name="modal"
          options={{
            drawerItemStyle: { display: 'none' },
          }}
        />
        <Drawer.Screen
          name="camera-mode"
          options={{
            drawerItemStyle: { display: 'none' },
          }}
        />
        <Drawer.Screen
          name="chat-mode"
          options={{
            drawerItemStyle: { display: 'none' },
          }}
        />
        <Drawer.Screen
          name="quiz-mode"
          options={{
            drawerItemStyle: { display: 'none' },
          }}
        />
        <Drawer.Screen
          name="quiz-screen"
          options={{
            drawerItemStyle: { display: 'none' },
          }}
        />
        <Drawer.Screen
          name="quiz-result"
          options={{
            drawerItemStyle: { display: 'none' },
          }}
        />
        <Drawer.Screen
          name="travel-plan"
          options={{
            drawerLabel: 'Quest AI Chat',
          }}
        />
        <Drawer.Screen
          name="quest-chat"
          options={{
            drawerLabel: 'Quest Chat',
          }}
        />
        <Drawer.Screen
          name="general-chat"
          options={{
            drawerLabel: 'General Chat',
          }}
        />
        <Drawer.Screen
          name="chat-history"
          options={{
            drawerItemStyle: { display: 'none' },
          }}
        />
        <Drawer.Screen
          name="stamp"
          options={{
            drawerItemStyle: { display: 'none' },
          }}
        />
        <Drawer.Screen
          name="login"
          options={{
            drawerItemStyle: { display: 'none' },
          }}
        />
        <Drawer.Screen
          name="signup"
          options={{
            drawerItemStyle: { display: 'none' },
          }}
        />
      </Drawer>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

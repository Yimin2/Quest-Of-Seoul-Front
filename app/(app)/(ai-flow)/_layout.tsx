import { Stack } from 'expo-router';
import { BackButton } from '@shared/ui';

export default function AiFlowLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#34495E' },
        headerTintColor: '#fff',
        headerLeft: () => <BackButton />,
      }}
    >
      {/* Chat */}
      <Stack.Screen name="chat/ai" options={{ title: 'AI Chat' }} />
      <Stack.Screen name="chat/ai-plus" options={{ title: 'AI Plus Chat' }} />
      <Stack.Screen name="chat/plan" options={{ title: 'Plan Chat' }} />
      <Stack.Screen name="chat/history" options={{ title: 'Chat History' }} />

      {/* Quiz */}
      <Stack.Screen name="quiz/intro" options={{ title: 'Quiz Mode' }} />
      <Stack.Screen name="quiz/play" options={{ title: 'Quiz' }} />
      <Stack.Screen name="quiz/result" options={{ title: 'Quiz Result' }} />
      <Stack.Screen name="quiz/completed" options={{ title: 'Complete' }} />

      {/* Photo */}
      <Stack.Screen name="photo/intro" options={{ title: 'Photo Zone' }} />
      <Stack.Screen name="photo/camera" options={{ title: 'Camera' }} />
      <Stack.Screen name="photo/camera-mode" options={{ title: 'Camera Mode' }} />
      <Stack.Screen name="photo/scan" options={{ title: 'QR Scan' }} />
      <Stack.Screen name="photo/result" options={{ title: 'Save Photo' }} />

      {/* Quest */}
      <Stack.Screen name="quest/intro" options={{ title: 'Treasure Hunt' }} />
      <Stack.Screen name="quest/play" options={{ title: 'Treasure Hunt' }} />

      {/* Mode Selector */}
      <Stack.Screen name="mode-selector" options={{ title: 'Mode Selector' }} />
    </Stack>
  );
}

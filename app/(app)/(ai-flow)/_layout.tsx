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
      <Stack.Screen name="chat/ai-chat" options={{ title: 'AI Chat' }} />
      <Stack.Screen name="chat/docent-chat" options={{ title: 'Docent Chat' }} />
      <Stack.Screen name="chat/plan-chat" options={{ title: 'Plan Chat' }} />
      <Stack.Screen name="chat/history" options={{ title: 'Chat History' }} />

      {/* Quiz */}
      <Stack.Screen name="quiz/mode" options={{ title: 'Quiz Mode' }} />
      <Stack.Screen name="quiz/screen" options={{ title: 'Quiz' }} />
      <Stack.Screen name="quiz/result" options={{ title: 'Quiz Result' }} />
      <Stack.Screen name="quiz/complete" options={{ title: 'Complete' }} />

      {/* Photo */}
      <Stack.Screen name="photo/index" options={{ title: 'Photo Zone' }} />
      <Stack.Screen name="photo/camera" options={{ title: 'Camera' }} />
      <Stack.Screen name="photo/camera-mode" options={{ title: 'Camera Mode' }} />
      <Stack.Screen name="photo/qr" options={{ title: 'QR Scan' }} />
      <Stack.Screen name="photo/save" options={{ title: 'Save Photo' }} />

      {/* Quest */}
      <Stack.Screen name="quest/intro" options={{ title: 'Treasure Hunt' }} />
      <Stack.Screen name="quest/scan" options={{ title: 'Stamp Quest' }} />

      {/* Mode Selector */}
      <Stack.Screen name="mode-selector" options={{ title: 'Mode Selector' }} />
    </Stack>
  );
}

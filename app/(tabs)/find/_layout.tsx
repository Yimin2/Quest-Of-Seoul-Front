import { Stack } from 'expo-router';

export default function FindStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="quest-recommendation" options={{ headerShown: false }} />
      <Stack.Screen name="recommendation-result" options={{ headerShown: false }} />
    </Stack>
  );
}

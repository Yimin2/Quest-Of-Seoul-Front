import { Stack } from 'expo-router';

export default function FindStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="image-search" options={{ headerShown: false }} />
      <Stack.Screen name="search-result" options={{ headerShown: false }} />
    </Stack>
  );
}

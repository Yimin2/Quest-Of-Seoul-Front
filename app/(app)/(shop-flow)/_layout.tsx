import { Stack } from 'expo-router';
import { BackButton } from '@shared/ui';

export default function ShopFlowLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#34495E' },
        headerTintColor: '#fff',
        headerLeft: () => <BackButton />,
      }}
    >
      <Stack.Screen name="coupon-list" options={{ title: 'My Coupons' }} />
      <Stack.Screen name="coupon-detail" options={{ title: 'Coupon Detail' }} />
      <Stack.Screen name="day-pass" options={{ title: 'Day Pass' }} />
    </Stack>
  );
}

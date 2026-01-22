import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ShopFlowLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: '#000',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 15 }}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
        ),
      }}
    >
      <Stack.Screen name="my-coupon" options={{ title: 'My Coupons' }} />
      <Stack.Screen name="reward-detail" options={{ title: 'Reward Detail' }} />
      <Stack.Screen name="day-pass" options={{ title: 'Day Pass' }} />
      <Stack.Screen name="my-purchase" options={{ title: 'My Purchases' }} />
      <Stack.Screen name="my-purchase-coupon-detail" options={{ title: 'Coupon Detail' }} />
    </Stack>
  );
}

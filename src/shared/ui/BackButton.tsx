import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TouchableOpacity, StyleProp, ViewStyle } from 'react-native';

interface BackButtonProps {
  color?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function BackButton({ color = '#fff', onPress, style }: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[{ padding: 4 }, style]}
      hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
    >
      <Ionicons name="arrow-back" size={24} color={color} />
    </TouchableOpacity>
  );
}

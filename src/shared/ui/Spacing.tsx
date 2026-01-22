import { View, type ViewStyle } from 'react-native';

interface SpacingProps {
  size?: number;
  layout?: 'vertical' | 'horizontal';
  style?: ViewStyle;
}

export function Spacing({ size = 12, layout = 'vertical', style }: SpacingProps) {
  return <View style={[layout === 'vertical' ? { height: size } : { width: size }, style]} />;
}

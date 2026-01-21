/**
 * Shared lib hooks - useThemeColor
 * @see https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@shared/config';
import { useColorScheme } from './useColorScheme';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
) {
  const theme = useColorScheme() ?? 'light';
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}

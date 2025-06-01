import { useColorScheme } from './useColorScheme';
import Colors from '@/constants/colors';

export function useThemeColor(
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark,
): string {
  const { colorScheme } = useColorScheme();
  return Colors[colorScheme === 'dark' ? 'dark' : 'light'][colorName];
}
import { useAppTheme } from '@/src/theme/ThemeProvider';

export function useColorScheme() {
  return useAppTheme().scheme;
}

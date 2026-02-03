export type ThemeMode = 'system' | 'light' | 'dark';

export type AppColorScheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'flashcards.themeMode';

export function resolveScheme(mode: ThemeMode, system: AppColorScheme): AppColorScheme {
  if (mode === 'system') return system;
  return mode;
}

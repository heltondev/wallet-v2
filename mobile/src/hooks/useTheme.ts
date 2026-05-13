import { useSettingsStore } from '../store/useSettingsStore';
import { darkColors, lightColors, type ThemeColors } from '../styles/theme';

export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const isDark = useSettingsStore(s => s.isDarkMode);
  return {
    colors: isDark ? darkColors : lightColors,
    isDark,
  };
}

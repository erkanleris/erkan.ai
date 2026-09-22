import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import colors from '@/constants/colors';
import { isThemeId, themeOptions, themePalettes, type ThemeId, type ThemePalette } from '@/constants/themes';

const THEME_STORAGE_KEY = 'erkan-theme';

type ThemeContextValue = {
  themeId: ThemeId;
  theme: ThemePalette;
  options: typeof themeOptions;
  setTheme: (themeId: ThemeId) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>('night');

  const applyTheme = useCallback((nextId: ThemeId) => {
    Object.assign(colors.light, themePalettes[nextId]);
    setThemeId(nextId);
  }, []);

  useEffect(() => {
    void AsyncStorage.getItem(THEME_STORAGE_KEY).then(value => {
      if (isThemeId(value)) applyTheme(value);
    });
  }, [applyTheme]);

  const setTheme = useCallback(async (nextId: ThemeId) => {
    applyTheme(nextId);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, nextId);
  }, [applyTheme]);

  const value = useMemo(() => ({
    themeId,
    theme: themePalettes[themeId],
    options: themeOptions,
    setTheme,
  }), [setTheme, themeId]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
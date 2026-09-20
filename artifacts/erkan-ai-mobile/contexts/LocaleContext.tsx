import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  countryToLocale,
  getLocaleText,
  localeToCountry,
  localesInfo,
} from '../../erkan-ai/src/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';

export { countryToLocale, localeToCountry, localesInfo };
export type Locale = Parameters<typeof getLocaleText>[0];
export type TranslationKey = Parameters<typeof getLocaleText>[1];

type LocaleContextValue = {
  locale: Locale;
  language: 'ar' | 'tr';
  isRtl: boolean;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => Promise<void>;
  syncUserCountry: (country: string | null | undefined) => Promise<void>;
  formatDate: (value: string | null | undefined) => string;
  formatTime: (value: string) => string;
};

const STORAGE_KEY = 'erkan_locale';
const LocaleContext = createContext<LocaleContextValue | null>(null);

function normalizeCountry(country: string | null | undefined) {
  return country?.trim().toLowerCase().replace(/[\s-]+/g, '_') ?? '';
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [locale, setLocaleState] = useState<Locale>('syrian');

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY).then(saved => {
      if (!active || !saved) return;
      if (Object.prototype.hasOwnProperty.call(countryToLocale, saved)) {
        setLocaleState(countryToLocale[saved]);
      }
    });
    return () => { active = false; };
  }, []);

  const syncUserCountry = useCallback(async (country: string | null | undefined) => {
    const nextLocale = countryToLocale[normalizeCountry(country)];
    if (!nextLocale) return;
    setLocaleState(nextLocale);
    await AsyncStorage.setItem(STORAGE_KEY, nextLocale);
  }, []);

  useEffect(() => {
    if (user?.country) void syncUserCountry(user.country);
  }, [syncUserCountry, user?.country]);

  const setLocale = useCallback(async (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    await AsyncStorage.setItem(STORAGE_KEY, nextLocale);
  }, []);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    language: locale === 'turkish' ? 'tr' : 'ar',
    isRtl: locale !== 'turkish',
    t: (key, params) => getLocaleText(locale, key, params),
    setLocale,
    syncUserCountry,
    formatDate: value => value
      ? new Date(value).toLocaleDateString(locale === 'turkish' ? 'tr-TR' : 'ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })
      : '—',
    formatTime: value => new Date(value).toLocaleTimeString(locale === 'turkish' ? 'tr-TR' : 'ar-SA', { hour: '2-digit', minute: '2-digit' }),
  }), [locale, setLocale, syncUserCountry]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useMobileLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useMobileLocale must be used inside LocaleProvider');
  return value;
}
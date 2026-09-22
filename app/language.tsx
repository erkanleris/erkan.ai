import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { adaptSavedContent, updateProfile } from '@/lib/mobile-api';
import { countryToLocale, localeToCountry, localesInfo, useMobileLocale, type Locale } from '@/contexts/LocaleContext';
import { TopBar } from '@/components/MobileChrome';
import colors from '@/constants/colors';

type Language = 'ar' | 'tr';
const locales = localesInfo;
const welcomeText: Record<Locale, string> = {
  syrian: 'أهلاً وسهلاً! تم تفعيل اللهجة السورية بنجاح.',
  egyptian: 'أهلاً وسهلاً! اللهجة المصرية اتفعّلت بنجاح.',
  gulf: 'يا هلا! تم تفعيل اللهجة الخليجية بنجاح.',
  iraqi: 'هلا بيك! تم تفعيل اللهجة العراقية بنجاح.',
  lebanese: 'أهلا وسهلا! تفعّلت اللهجة اللبنانية بنجاح.',
  jordanian: 'يا هلا! تم تفعيل اللهجة الأردنية بنجاح.',
  palestinian: 'أهلا وسهلا! تم تفعيل اللهجة الفلسطينية بنجاح.',
  algerian: 'مرحبا بيك! تفعّلت الدارجة الجزائرية بنجاح.',
  moroccan: 'مرحبا بيك! تفعّلات الدارجة المغربية بنجاح.',
  tunisian: 'عسلامة! تفعّلت اللهجة التونسية بنجاح.',
  turkish: 'Hoş geldin! Türkçe başarıyla etkinleştirildi.',
};

export default function LanguageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading, updateUser } = useAuth();
  const { locale: activeLocale, setLocale: persistLocale, t } = useMobileLocale();
  const initialLocale = (user?.country && countryToLocale[user.country]) || activeLocale;
  const [step, setStep] = useState<1 | 2>(1);
  const [language, setLanguage] = useState<Language>(initialLocale === 'turkish' ? 'tr' : 'ar');
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState<'idle' | 'downloading' | 'complete' | 'error'>('idle');
  const [error, setError] = useState('');
  useEffect(() => {
    if (state === 'idle' && activeLocale !== locale) {
      setLocale(activeLocale);
      setLanguage(activeLocale === 'turkish' ? 'tr' : 'ar');
    }
  }, [activeLocale, locale, state]);
  useEffect(() => {
    if (!authLoading && !user) router.replace('/');
  }, [authLoading, router, user]);
  const targetText = useMemo(() => {
     if (progress >= 25) return t('adaptingContent');
    if (locale === 'turkish') return 'Dil paketi indiriliyor...';
    if (locale === 'egyptian') return 'بننزّل حزمة اللغة...';
    if (locale === 'gulf') return 'قاعدين نحمّل حزمة اللهجة...';
    if (locale === 'iraqi') return 'دا نحمّل حزمة اللهجة...';
    if (locale === 'lebanese') return 'عم ننزّل حزمة اللهجة...';
    if (locale === 'jordanian') return 'بنحمل حزمة اللغة...';
    if (locale === 'algerian') return 'راهنا نحمّلو حزمة اللغة...';
    if (locale === 'moroccan') return 'كنحمّلو حزمة اللغة...';
    if (locale === 'tunisian') return 'قاعدين نهبّطوا حزمة اللهجة...';
     return t('dlPack');
   }, [locale, progress, t]);

  const confirm = async () => {
    setState('downloading');
    setError('');
    setProgress(1);
    let timer: ReturnType<typeof setInterval> | undefined;
    let startTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      const serverOperation = (async () => {
        const nextUser = await updateProfile({ country: localeToCountry[locale] });
        updateUser(nextUser);
        await persistLocale(locale);
        await adaptSavedContent();
      })();
      const visibleProgress = new Promise<void>(resolve => {
        startTimer = setTimeout(() => {
          let displayed = 1;
          timer = setInterval(() => {
            displayed += 1;
            setProgress(displayed);
            if (displayed >= 99) {
              if (timer) clearInterval(timer);
              resolve();
            }
          }, 60);
        }, 700);
      });
      await Promise.all([serverOperation, visibleProgress]);
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 700));
      setState('complete');
      await new Promise(resolve => setTimeout(resolve, 1800));
      router.back();
    } catch (cause) {
      if (startTimer) clearTimeout(startTimer);
      if (timer) clearInterval(timer);
      setState('error');
       setError(cause instanceof Error ? cause.message : t('adaptError'));
    }
  };

  if (state === 'downloading' || state === 'complete' || state === 'error') {
    return <View style={styles.overlay}><View style={styles.overlayGlow} />{state === 'error' ? <Feather name="alert-triangle" size={52} color="#f87171" /> : state === 'complete' ? <View style={styles.complete}><Feather name="check" size={43} color="#fff" /></View> : <ActivityIndicator size="large" color={colors.light.primary} />}<Text style={[styles.overlayTitle, state === 'error' && styles.errorText]}>{state === 'error' ? error : state === 'complete' ? welcomeText[locale] : targetText}</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${state === 'complete' ? 100 : progress}%` }]} /></View><Text style={styles.progressText}>{state === 'complete' ? 100 : progress}%</Text>{state === 'error' && <Pressable onPress={() => void confirm()} style={styles.retry}><Text style={styles.retryText}>حاول مرة أخرى</Text></Pressable>}</View>;
  }

    return <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }}>
     <TopBar title={t('langTitle')} />
     {step === 1 ? <><Text style={styles.stepTitle}>{t('langSelTitle')}</Text><Pressable onPress={() => { setLanguage('ar'); setLocale('syrian'); }} style={[styles.languageCard, language === 'ar' && styles.selected]}><View style={styles.flag}><Text style={styles.flagText}>ع</Text></View><View style={styles.cardCopy}><Text style={styles.cardTitle}>{t('langArabic')}</Text><Text style={styles.cardDetail}>ERKAN AI</Text></View>{language === 'ar' && <Feather name="check-circle" size={21} color={colors.light.primary} />}</Pressable><Pressable onPress={() => { setLanguage('tr'); setLocale('turkish'); }} style={[styles.languageCard, language === 'tr' && styles.selected]}><View style={styles.flag}><Text style={styles.flagText}>TR</Text></View><View style={styles.cardCopy}><Text style={styles.cardTitle}>{t('langTurkish')}</Text><Text style={styles.cardDetail}>ERKAN AI</Text></View>{language === 'tr' && <Feather name="check-circle" size={21} color={colors.light.primary} />}</Pressable><Pressable onPress={() => language === 'ar' ? setStep(2) : void confirm()} style={styles.confirm}><Text style={styles.confirmText}>{language === 'ar' ? t('continueBtn') : t('confirmLang')}</Text><Feather name="arrow-left" size={18} color="#fff" /></Pressable></> : <><Text style={styles.stepTitle}>{t('dialectTitle')}</Text><View style={styles.grid}>{locales.map(item => <Pressable key={item.id} onPress={() => setLocale(item.id as Locale)} style={[styles.dialectCard, locale === item.id && styles.selected]}><Text style={styles.dialectFlag}>{item.flag}</Text><Text style={styles.dialectName}>{item.label}</Text>{locale === item.id && <View style={styles.selectedMark}><Feather name="check" size={12} color="#fff" /></View>}</Pressable>)}</View><Pressable onPress={() => void confirm()} style={styles.confirm}><Feather name="globe" size={18} color="#fff" /><Text style={styles.confirmText}>{t('confirmLang')}</Text></Pressable></>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.light.background, paddingHorizontal: 18 }, stepTitle: { color: colors.light.foreground, fontSize: 16, fontWeight: '800', textAlign: 'right', marginTop: 10, marginBottom: 12 }, languageCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, minHeight: 78, padding: 14, marginBottom: 10, borderRadius: 17, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border }, selected: { borderColor: colors.light.primary, backgroundColor: '#10294f' }, flag: { width: 44, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#17376d' }, flagText: { color: '#bceeff', fontSize: 13, fontWeight: '900' }, cardCopy: { flex: 1 }, cardTitle: { color: colors.light.foreground, fontSize: 14, fontWeight: '800', textAlign: 'right' }, cardDetail: { color: colors.light.mutedForeground, fontSize: 10, textAlign: 'right', marginTop: 4 }, confirm: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 50, marginTop: 8, borderRadius: 15, backgroundColor: colors.light.primary }, confirmText: { color: '#fff', fontSize: 13, fontWeight: '800' }, grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 9 }, dialectCard: { width: '48%', minHeight: 100, padding: 12, borderRadius: 16, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, position: 'relative' }, dialectFlag: { fontSize: 25, textAlign: 'right' }, dialectName: { color: colors.light.foreground, fontSize: 13, fontWeight: '800', textAlign: 'right', marginTop: 5 }, dialectDetail: { color: colors.light.mutedForeground, fontSize: 9, textAlign: 'right', marginTop: 4 }, selectedMark: { position: 'absolute', top: 9, left: 9, width: 22, height: 22, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.primary }, overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28, backgroundColor: '#020817' }, overlayGlow: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#122d6a', opacity: 0.35 }, overlayTitle: { color: '#fff', fontSize: 17, fontWeight: '800', textAlign: 'center', lineHeight: 28, marginTop: 22 }, errorText: { color: '#fca5a5' }, progressTrack: { width: '100%', height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: '#18294c', marginTop: 25 }, progressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.light.primary }, progressText: { color: '#b9c9e8', fontSize: 13, fontWeight: '800', marginTop: 10 }, complete: { width: 78, height: 78, borderRadius: 39, alignItems: 'center', justifyContent: 'center', backgroundColor: '#159b72' }, retry: { paddingHorizontal: 24, paddingVertical: 12, marginTop: 22, borderRadius: 12, backgroundColor: colors.light.primary }, retryText: { color: '#fff', fontWeight: '800' },
});
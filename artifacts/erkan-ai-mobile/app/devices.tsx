import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { endAuthSession, endOtherAuthSessions, getAuthSessions, type AuthSession } from '@/lib/mobile-api';
import { GlowCard, SectionLabel, TopBar } from '@/components/MobileChrome';
import colors from '@/constants/colors';
import { FeedbackModal } from '@/components/FeedbackModal';
import { ConfirmationSheet } from '@/components/ConfirmationSheet';

export default function DevicesScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<AuthSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | 'others' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirm, setConfirm] = useState<{ session?: AuthSession; others?: boolean } | null>(null);
  const [feedback, setFeedback] = useState<{ title: string; message: string } | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setItems(await getAuthSessions()); }
    catch (error) { setError(error instanceof Error ? error.message : 'تعذر تحميل الجلسات.'); }
    finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const revoke = (session: AuthSession) => setConfirm({ session });
  const revokeOthers = () => setConfirm({ others: true });
  const confirmRevoke = async () => {
    const session = confirm?.session;
    const others = confirm?.others;
    if (!session && !others) return;
    if (session) {
      setBusy(session.id);
      try {
        const result = await endAuthSession(session.id);
        if (result.current) setFeedback({ title: 'انتهت الجلسة', message: 'سجّل الدخول مرة أخرى للمتابعة.' });
        setItems(current => current.filter(item => item.id !== session.id));
      } catch (error) { setFeedback({ title: 'تعذر إنهاء الجلسة', message: error instanceof Error ? error.message : 'حاول مرة أخرى.' }); }
      finally { setBusy(null); setConfirm(null); }
    } else {
      setBusy('others');
      try { const result = await endOtherAuthSessions(); setFeedback({ title: 'تم الإنهاء', message: `تم إنهاء ${result.revoked} جلسة.` }); await load(); }
      catch (error) { setFeedback({ title: 'تعذر إنهاء الجلسات', message: error instanceof Error ? error.message : 'حاول مرة أخرى.' }); }
      finally { setBusy(null); setConfirm(null); }
    }
  };

  return <><ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}>
    <TopBar title="الأجهزة والجلسات" />
    {error ? <View style={styles.error}><Text style={styles.errorText}>{error}</Text><Pressable onPress={() => void load()}><Text style={styles.retry}>إعادة المحاولة</Text></Pressable></View> : null}
    {notice ? <Text style={styles.notice}>{notice}</Text> : null}
    <GlowCard accent="blue" style={styles.hero}><Feather name="monitor" size={24} color="#7fd7ff" /><Text style={styles.heroTitle}>جلسات حسابك</Text><Text style={styles.heroText}>راجع الأجهزة المتصلة وأنهِ أي جلسة غير معروفة.</Text></GlowCard>
    <SectionLabel>الأجهزة النشطة</SectionLabel>
    {loading ? <ActivityIndicator color={colors.light.primary} style={styles.loader} /> : items.length === 0 ? <Text style={styles.empty}>لا توجد جلسات نشطة</Text> : items.map(item => <View key={item.id} style={styles.device}><View style={styles.deviceIcon}><Feather name={item.deviceName.toLowerCase().includes('android') ? 'smartphone' : 'monitor'} size={19} color={colors.light.primary} /></View><View style={styles.deviceText}><Text style={styles.deviceName}>{item.deviceName}</Text><Text style={styles.deviceMeta}>{item.browser} · {item.ipAddress ?? 'عنوان غير متاح'}</Text><Text style={styles.deviceDate}>آخر استخدام: {new Date(item.lastUsedAt).toLocaleString('ar-EG')}</Text></View>{item.isCurrent ? <Text style={styles.current}>الحالية</Text> : <Pressable disabled={busy === item.id} onPress={() => revoke(item)}><Text style={styles.revoke}>{busy === item.id ? '...' : 'إنهاء'}</Text></Pressable>}</View>)}
    <Pressable disabled={busy !== null || !items.some(item => !item.isCurrent)} onPress={revokeOthers} style={[styles.endOthers, !items.some(item => !item.isCurrent) && { opacity: 0.45 }]}><Feather name="log-out" size={16} color="#ff9aa8" /><Text style={styles.endOthersText}>{busy === 'others' ? 'جارٍ الإنهاء...' : 'إنهاء جميع الجلسات الأخرى'}</Text></Pressable>
  </ScrollView>
  <ConfirmationSheet visible={Boolean(confirm)} title={confirm?.others ? 'إنهاء الجلسات الأخرى' : 'إنهاء الجلسة'} message={confirm?.others ? 'سيبقى هذا الجهاز متصلاً وسيتم إنهاء بقية الجلسات.' : `هل تريد إنهاء جلسة ${confirm?.session?.deviceName ?? ''}؟`} confirmLabel={confirm?.others ? 'إنهاء الكل' : 'إنهاء'} destructive busy={busy !== null} onCancel={() => setConfirm(null)} onConfirm={() => void confirmRevoke()} />
  {feedback && <FeedbackModal {...feedback} onClose={() => setFeedback(null)} />}
  </>;
}

const styles = StyleSheet.create({
  error: { padding: 12, borderRadius: 12, backgroundColor: '#4b2030', marginBottom: 10, gap: 6 },
  errorText: { color: '#ffc5cc', textAlign: 'right', fontSize: 11 },
  retry: { color: '#9edcff', textAlign: 'right', fontWeight: '800' },
  notice: { color: '#72e2b9', textAlign: 'right', padding: 8 },
  screen: { flex: 1, backgroundColor: colors.light.background, paddingHorizontal: 18 }, hero: { gap: 8 }, heroTitle: { color: '#fff', fontSize: 17, fontWeight: '800', textAlign: 'right' }, heroText: { color: '#a8c5ef', fontSize: 11, lineHeight: 19, textAlign: 'right' }, loader: { marginTop: 40 }, empty: { color: colors.light.mutedForeground, textAlign: 'center', padding: 25, fontSize: 11 }, device: { flexDirection: 'row-reverse', alignItems: 'center', gap: 11, padding: 14, borderRadius: 16, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, marginBottom: 9 }, deviceIcon: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#122850' }, deviceText: { flex: 1 }, deviceName: { color: colors.light.foreground, fontSize: 12, fontWeight: '700', textAlign: 'right' }, deviceMeta: { color: colors.light.mutedForeground, fontSize: 9, textAlign: 'right', marginTop: 4 }, deviceDate: { color: '#6176a7', fontSize: 8, textAlign: 'right', marginTop: 3 }, current: { color: '#55e0ac', fontSize: 10, fontWeight: '800' }, revoke: { color: colors.light.destructive, fontSize: 10, fontWeight: '800' }, endOthers: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14, marginTop: 12, borderRadius: 14, backgroundColor: '#321b31', borderWidth: 1, borderColor: '#633044' }, endOthersText: { color: '#ffb1bb', fontSize: 11, fontWeight: '800' },
});
import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ActionRow, GlowCard, SectionLabel, TopBar } from '@/components/MobileChrome';
import colors from '@/constants/colors';
import { registerForPushNotificationsAsync, unregisterForPushNotificationsAsync } from '@/lib/push-notifications';
import {
  deleteConversationHistory,
  getPrivacySettings,
  getSecurityEvents,
  startTwoFactorSetup,
  updatePrivacySettings,
  verifyTwoFactor,
  disableTwoFactor,
  exportPrivacyData,
  type PrivacySettings,
  type SecurityEvent,
} from '@/lib/mobile-api';
import { FeedbackModal } from '@/components/FeedbackModal';
import { ConfirmationSheet } from '@/components/ConfirmationSheet';

export default function PrivacyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [setup, setSetup] = useState<{ secret: string; otpauthUri: string } | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState('');
  const [pushEnabled, setPushEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState('');
  const [clearConfirm, setClearConfirm] = useState(false);
  const [feedback, setFeedback] = useState<{ title: string; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setLoadError('');
    try {
      const [nextSettings, nextEvents] = await Promise.all([getPrivacySettings(), getSecurityEvents()]);
      setSettings(nextSettings);
      setEvents(nextEvents);
      setPushEnabled((await AsyncStorage.getItem('erkan-push-enabled')) !== 'false');
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'تعذر تحميل إعدادات الخصوصية.');
    } finally { setLoading(false); }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const changeAlerts = async (enabled: boolean) => {
    setBusy('alerts');
    try { setSettings(await updatePrivacySettings({ loginAlertsEnabled: enabled })); setNotice('تم حفظ الإعداد.'); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر حفظ الإعداد.'); }
    finally { setBusy(''); }
  };
  const changeRetention = async (days: number) => {
    setBusy('retention');
    try { setSettings(await updatePrivacySettings({ dataRetentionDays: days })); setNotice('تم حفظ مدة الاحتفاظ.'); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر حفظ مدة الاحتفاظ.'); }
    finally { setBusy(''); }
  };
  const beginTwoFactor = async () => {
    setBusy('2fa');
    try { setSetup(await startTwoFactorSetup()); }
    catch (error) { setFeedback({ title: 'تعذر بدء المصادقة الثنائية', message: error instanceof Error ? error.message : 'حاول مرة أخرى.' }); }
    finally { setBusy(''); }
  };
  const confirmTwoFactor = async () => {
    if (code.trim().length !== 6) return;
    setBusy('2fa');
    try { setSettings(await verifyTwoFactor(code.trim())); setSetup(null); setCode(''); }
    catch (error) { setFeedback({ title: 'رمز غير صحيح', message: error instanceof Error ? error.message : 'تحقق من الرمز.' }); }
    finally { setBusy(''); }
  };
  const turnOffTwoFactor = async () => {
    if (code.trim().length !== 6) return;
    setBusy('2fa');
    try { setSettings(await disableTwoFactor(code.trim())); setCode(''); }
    catch (error) { setFeedback({ title: 'تعذر إيقاف المصادقة', message: error instanceof Error ? error.message : 'تحقق من الرمز.' }); }
    finally { setBusy(''); }
  };
  const clearChats = () => setClearConfirm(true);
  const confirmClearChats = async () => {
    setClearConfirm(false);
      setBusy('delete');
      try { const count = await deleteConversationHistory(); setFeedback({ title: 'تم الحذف', message: `تم حذف ${count} محادثة.` }); }
      catch (error) { setFeedback({ title: 'تعذر الحذف', message: error instanceof Error ? error.message : 'حاول مرة أخرى.' }); }
      finally { setBusy(''); }
  };
  const exportData = async () => {
    setBusy('export');
    try {
      const data = await exportPrivacyData();
      await Share.share({ title: 'بيانات ERKAN AI', message: JSON.stringify(data, null, 2) });
    } catch (error) { setFeedback({ title: 'تعذر تصدير البيانات', message: error instanceof Error ? error.message : 'حاول مرة أخرى.' }); }
    finally { setBusy(''); }
  };
  const changePush = async (enabled: boolean) => {
    setBusy('push');
    try {
      if (enabled) {
        const token = await registerForPushNotificationsAsync();
        if (!token) throw new Error('لم يتم منح صلاحية الإشعارات على هذا الجهاز.');
      } else {
        await unregisterForPushNotificationsAsync();
      }
      await AsyncStorage.setItem('erkan-push-enabled', String(enabled));
      setPushEnabled(enabled);
    } catch (error) {
      setFeedback({ title: 'تعذر تحديث الإشعارات', message: error instanceof Error ? error.message : 'افتح صلاحية الإشعارات وحاول مرة أخرى.' });
    } finally { setBusy(''); }
  };

  return <><ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 25 }}>
    {loading ? <Text style={styles.state}>جارٍ تحميل إعدادات الخصوصية...</Text> : null}
    {loadError ? <View style={styles.error}><Text style={styles.errorText}>{loadError}</Text><Pressable onPress={() => void load()}><Text style={styles.retry}>إعادة المحاولة</Text></Pressable></View> : null}
    {notice ? <Text style={styles.notice}>{notice}</Text> : null}
    <TopBar title="الخصوصية والأمان" subtitle="تحكم كامل في بياناتك وحماية حسابك" />
    <GlowCard accent="teal" style={styles.secure}><View style={styles.secureIcon}><Feather name="shield" size={21} color="#55dfb0" /></View><View><Text style={styles.secureTitle}>حسابك محمي</Text><Text style={styles.secureText}>إعداداتك محفوظة على الخادم</Text></View></GlowCard>
    <SectionLabel>أمان الحساب</SectionLabel>
    <ToggleRow icon="bell" title="تنبيهات تسجيل الدخول" description="أعلمني عند تسجيل الدخول من جهاز جديد" value={settings?.loginAlertsEnabled ?? true} disabled={busy === 'alerts'} onChange={value => void changeAlerts(value)} />
    <ToggleRow icon="smartphone" title="إشعارات Android" description="استقبال تنبيهات الحساب والاشتراك والمحفظة" value={pushEnabled} disabled={busy === 'push'} onChange={value => void changePush(value)} />
    <View style={styles.twoFactorCard}><View style={styles.twoFactorCopy}><Text style={styles.toggleTitle}>{settings?.twoFactorEnabled ? 'المصادقة الثنائية مفعلة' : 'المصادقة الثنائية غير مفعلة'}</Text><Text style={styles.toggleDescription}>طبقة حماية إضافية للحساب</Text></View><Pressable disabled={busy === '2fa'} onPress={() => settings?.twoFactorEnabled ? setSetup({ secret: '', otpauthUri: '' }) : void beginTwoFactor()} style={styles.smallButton}><Text style={styles.smallButtonText}>{settings?.twoFactorEnabled ? 'إيقاف' : busy === '2fa' ? '...' : 'إعداد'}</Text></Pressable></View>
    {setup && <View style={styles.setupCard}>{setup.secret ? <><Text style={styles.setupTitle}>انسخ المفتاح إلى تطبيق المصادقة</Text><Text selectable style={styles.secret}>{setup.secret}</Text><Text style={styles.setupHint}>{setup.otpauthUri}</Text></> : <Text style={styles.setupTitle}>أدخل رمز تطبيق المصادقة لإيقافها</Text>}<TextInput value={code} onChangeText={value => setCode(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} placeholder="000000" placeholderTextColor={colors.light.mutedForeground} style={styles.codeInput} /><PrimaryAction label={setup.secret ? 'تفعيل المصادقة' : 'تأكيد الإيقاف'} disabled={code.length !== 6 || busy === '2fa'} onPress={() => void (setup.secret ? confirmTwoFactor() : turnOffTwoFactor())} /></View>}
    <SectionLabel>بياناتك</SectionLabel>
    <SectionLabel>مدة الاحتفاظ بالمحادثات</SectionLabel>
    <View style={styles.retentionRow}>{[0, 30, 90, 365].map(days => <Pressable key={days} disabled={busy === 'retention'} onPress={() => void changeRetention(days)} style={[styles.retention, settings?.dataRetentionDays === days && styles.retentionSelected]}><Text style={[styles.retentionText, settings?.dataRetentionDays === days && styles.retentionTextSelected]}>{days === 0 ? 'دائماً' : `${days} يوم`}</Text></Pressable>)}</View>
    <ActionRow icon="download" title={busy === 'export' ? 'جار تجهيز بياناتك...' : 'تصدير بياناتي'} description="احصل على نسخة من بيانات الحساب والمحادثات" onPress={() => void exportData()} />
    <ActionRow icon="trash-2" title={busy === 'delete' ? 'جار الحذف...' : 'حذف سجل المحادثات'} description="هذا الإجراء لا يمكن التراجع عنه" danger onPress={clearChats} />
    <SectionLabel>تنبيهات الأمان</SectionLabel>
    {events.length === 0 ? <View style={styles.noEvents}><Feather name="bell-off" size={19} color={colors.light.mutedForeground} /><Text style={styles.noEventsText}>لا توجد أحداث أمان جديدة</Text></View> : events.map(event => <View key={event.id} style={styles.event}><View style={styles.eventDot} /><View style={{ flex: 1 }}><Text style={styles.eventTitle}>تسجيل دخول جديد</Text><Text style={styles.eventText}>{event.deviceName} · {event.browser}</Text><Text style={styles.eventDate}>{new Date(event.createdAt).toLocaleString('ar-EG')}</Text></View></View>)}
    <SectionLabel>المستندات</SectionLabel>
    <ActionRow icon="file-text" title="سياسة الخصوصية" onPress={() => router.push({ pathname: '/legal', params: { kind: 'privacy' } })} />
  </ScrollView>
  <ConfirmationSheet visible={clearConfirm} title="حذف سجل المحادثات" message="هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء." confirmLabel="حذف" destructive busy={busy === 'delete'} onCancel={() => setClearConfirm(false)} onConfirm={() => void confirmClearChats()} />
  {feedback && <FeedbackModal {...feedback} onClose={() => setFeedback(null)} />}
  </>;
}

function ToggleRow({ icon, title, description, value, disabled, onChange }: { icon: keyof typeof Feather.glyphMap; title: string; description: string; value: boolean; disabled?: boolean; onChange: (value: boolean) => void }) {
  return <View style={styles.toggleRow}><Pressable disabled={disabled} onPress={() => onChange(!value)} style={[styles.toggle, value && styles.toggleOn]}><View style={[styles.toggleThumb, value && styles.toggleThumbOn]} /></Pressable><View style={styles.toggleText}><Text style={styles.toggleTitle}>{title}</Text><Text style={styles.toggleDescription}>{description}</Text></View><View style={styles.toggleIcon}><Feather name={icon} size={17} color={colors.light.primary} /></View></View>;
}
function PrimaryAction({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) { return <Pressable disabled={disabled} onPress={onPress} style={[styles.primaryAction, disabled && { opacity: 0.45 }]}><Text style={styles.primaryActionText}>{label}</Text></Pressable>; }
const styles = StyleSheet.create({
  state: { color: colors.light.mutedForeground, textAlign: 'center', padding: 14 },
  error: { padding: 12, borderRadius: 12, backgroundColor: '#4b2030', marginBottom: 10 },
  errorText: { color: '#ffc5cc', textAlign: 'right', fontSize: 11 },
  retry: { color: '#9edcff', textAlign: 'right', fontWeight: '800', marginTop: 6 },
  notice: { color: '#72e2b9', textAlign: 'right', padding: 8 },
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 18 },
  secure: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  secureIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#14584f' },
  secureTitle: { color: '#fff', fontSize: 14, fontWeight: '800', textAlign: 'right' },
  secureText: { color: '#8fd8c6', fontSize: 10, textAlign: 'right', marginTop: 3 },
  toggleRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 11, minHeight: 69, paddingHorizontal: 13, borderRadius: 16, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, marginBottom: 9 },
  toggleText: { flex: 1 }, toggleTitle: { color: colors.light.foreground, textAlign: 'right', fontSize: 12, fontWeight: '700' }, toggleDescription: { color: colors.light.mutedForeground, textAlign: 'right', fontSize: 10, marginTop: 3 },
  toggleIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#122850' },
  toggle: { width: 45, height: 26, borderRadius: 14, padding: 3, justifyContent: 'center', backgroundColor: '#26385f' }, toggleOn: { backgroundColor: '#277dbe' }, toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#8797ba' }, toggleThumbOn: { alignSelf: 'flex-end', backgroundColor: '#a9e8ff' },
  twoFactorCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 11, minHeight: 69, padding: 13, borderRadius: 16, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, marginBottom: 9 }, twoFactorCopy: { flex: 1 },
  smallButton: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 11, backgroundColor: '#23599e' }, smallButtonText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  setupCard: { padding: 14, marginBottom: 10, borderRadius: 16, backgroundColor: '#121e42', borderWidth: 1, borderColor: '#3768bb', gap: 9 }, setupTitle: { color: colors.light.foreground, fontSize: 12, fontWeight: '800', textAlign: 'right' }, secret: { color: '#9fdbff', fontSize: 13, textAlign: 'center', letterSpacing: 1 }, setupHint: { color: colors.light.mutedForeground, fontSize: 8, textAlign: 'left' }, codeInput: { height: 47, color: colors.light.foreground, backgroundColor: colors.light.background, borderWidth: 1, borderColor: colors.light.border, borderRadius: 12, textAlign: 'center', letterSpacing: 5, fontSize: 18 }, primaryAction: { minHeight: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.primary }, primaryActionText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  retentionRow: { flexDirection: 'row-reverse', gap: 7, marginBottom: 12 }, retention: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border }, retentionSelected: { backgroundColor: '#1f4d91', borderColor: colors.light.primary }, retentionText: { color: colors.light.mutedForeground, fontSize: 10 }, retentionTextSelected: { color: '#fff', fontWeight: '800' },
  event: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, padding: 13, borderRadius: 15, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, marginBottom: 8 }, eventDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#55dfb0' }, eventTitle: { color: colors.light.foreground, textAlign: 'right', fontSize: 11, fontWeight: '800' }, eventText: { color: colors.light.mutedForeground, textAlign: 'right', fontSize: 10, marginTop: 3 }, eventDate: { color: '#6176a7', textAlign: 'right', fontSize: 9, marginTop: 3 }, noEvents: { alignItems: 'center', gap: 7, padding: 20 }, noEventsText: { color: colors.light.mutedForeground, fontSize: 11 },
});
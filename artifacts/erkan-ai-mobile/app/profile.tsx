import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { getMe, getSubscriptionStatus, updateProfile, type MobileUser, type SubscriptionStatus } from '@/lib/mobile-api';
import { ActionRow, GlowCard, Pill, PrimaryButton, ScreenBackground, SectionLabel, TopBar } from '@/components/MobileChrome';
import colors from '@/constants/colors';
import { FeedbackModal } from '@/components/FeedbackModal';

function planLabel(plan: string) { return plan === 'pro_max' ? 'مطنوخ' : plan === 'pro' ? 'على البركة' : 'درويش'; }
function planTone(plan: string): 'blue' | 'purple' | 'green' { return plan === 'pro_max' ? 'purple' : plan === 'pro' ? 'blue' : 'green'; }
function daysSince(date: string) { return Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86400000)); }

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading: authLoading, updateUser } = useAuth();
  const [profile, setProfile] = useState<MobileUser | null>(user);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ title: string; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [nextProfile, nextSubscription] = await Promise.all([getMe(), getSubscriptionStatus()]);
      setProfile(nextProfile);
      setSubscription(nextSubscription);
      updateUser(nextProfile);
    } catch (error) {
      if (!user) setFeedback({ title: 'تعذر تحميل الملف الشخصي', message: error instanceof Error ? error.message : 'حاول مرة أخرى.' });
    } finally { setLoading(false); }
  }, [updateUser, user]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  useEffect(() => {
    if (!authLoading && !user) router.replace('/');
  }, [authLoading, router, user]);

  const uploadAvatar = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.88, base64: true });
    if (picked.canceled || !picked.assets[0]?.base64) return;
    setAvatarBusy(true);
    try {
      const next = await updateProfile({ avatarUrl: `data:image/jpeg;base64,${picked.assets[0].base64}` });
      setProfile(next);
      updateUser(next);
    } catch (error) {
      setFeedback({ title: 'تعذر تحديث الصورة', message: error instanceof Error ? error.message : 'حاول مرة أخرى.' });
    } finally { setAvatarBusy(false); }
  };

  const current = profile ?? user;
  if (loading && !current) return <View style={styles.loading}><ActivityIndicator color={colors.light.primary} size="large" /></View>;
  if (!current) return null;
  const plan = current.subscriptionType ?? 'free';
  const percent = subscription ? Math.min(100, Math.round((subscription.dailyUsed / Math.max(subscription.dailyLimit, 1)) * 100)) : 0;
  const remaining = subscription ? Math.max(0, subscription.dailyLimit - subscription.dailyUsed) : 0;
  const initials = current.name.split(' ').map(value => value[0] ?? '').join('').toUpperCase().slice(0, 2) || 'E';

  return <ScreenBackground><ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }}>
    <TopBar title="الملف الشخصي" right={<Pressable onPress={() => router.push('/settings')} style={styles.topIcon}><Feather name="settings" size={19} color={colors.light.foreground} /></Pressable>} />
    <View style={styles.hero}>
      <View style={styles.cover} />
      <View style={styles.heroBody}>
        <View style={styles.kicker}><View style={styles.kickerDot} /><Text style={styles.kickerText}>ERKAN AI</Text><Text style={styles.kickerSeparator}>•</Text><Text style={styles.kickerText}>متصل الآن</Text></View>
        <Pressable disabled={avatarBusy} onPress={() => void uploadAvatar()} style={styles.avatarWrap}>
          {current.avatarUrl ? <Image source={{ uri: current.avatarUrl }} style={styles.avatarImage} /> : <Text style={styles.avatarText}>{initials}</Text>}
          <View style={styles.avatarOverlay}>{avatarBusy ? <ActivityIndicator color="#fff" /> : <Feather name="camera" size={20} color="#fff" />}</View>
          <View style={styles.online} />
        </Pressable>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{current.name}</Text>
          {current.isVerified && (
             <Pressable onPress={() => setFeedback({ title: 'حساب موثّق', message: 'تم توثيق هذا الحساب من فريق ERKAN AI.' })} style={styles.verifiedBadge}>
              <Feather name="check-circle" size={16} color="#69c7ff" />
            </Pressable>
          )}
        </View>
        <Text style={styles.handle}>@{current.username}</Text>
        {current.bio ? <Text style={styles.bio}>{current.bio}</Text> : null}
        <Pill tone={planTone(plan)}>{planLabel(plan)}</Pill>
      </View>
    </View>

    <View style={styles.stats}><Stat icon="message-circle" value={String(current.conversationCount ?? 0)} label="محادثات" /><Stat icon="image" value={String(current.imageCount ?? 0)} label="صور" /><Stat icon="calendar" value={String(daysSince(current.createdAt))} label="يوم" /></View>

    <SectionLabel>الاشتراك والاستخدام</SectionLabel>
    <GlowCard accent={plan === 'pro_max' ? 'purple' : 'blue'} style={styles.subscriptionCard}>
       <Pressable testID="mobile-subscription-plan" onPress={() => router.push('/subscription-management')} style={styles.subscriptionTop}><View style={styles.subscriptionIcon}><Feather name={plan === 'free' ? 'zap' : plan === 'pro_max' ? 'star' : 'award'} size={23} color={plan === 'pro_max' ? '#d5adff' : '#9fddff'} /></View><View style={{ flex: 1 }}><Text style={styles.planName}>{planLabel(plan)}</Text><Text style={styles.planHint}>{plan === 'free' ? 'طوّر تجربتك مع على البركة' : current.subscriptionExpiresAt ? `تنتهي في ${new Date(current.subscriptionExpiresAt).toLocaleDateString('ar-EG')}` : 'إدارة اشتراكك'}</Text></View><Feather name="chevron-left" size={18} color="#8ca3cd" /></Pressable>
      {subscription && <View style={styles.usage}><View style={styles.usageRow}><Text style={styles.usageLabel}>الاستخدام اليومي</Text><Text style={styles.usageNumber}>{subscription.dailyUsed}<Text style={styles.usageLimit}>/{subscription.dailyLimit}</Text></Text></View><View style={styles.usageTrack}><View style={[styles.usageFill, { width: `${percent}%`, backgroundColor: percent > 90 ? '#ef4444' : colors.light.primary }]} /></View><Text style={styles.remaining}>{remaining > 0 ? `متبقي ${remaining} رسالة` : 'تم الوصول إلى الحد اليومي'}</Text></View>}
       <View style={styles.planActions}><PrimaryButton secondary onPress={() => router.push('/activate')}>تفعيل كود</PrimaryButton><PrimaryButton onPress={() => router.push(plan === 'free' ? '/plans' : '/subscription-management')}>{plan === 'free' ? 'ترقية الخطة' : 'إدارة الاشتراك'}</PrimaryButton></View>
    </GlowCard>

    {current.userId && <><SectionLabel>معرّف المستخدم</SectionLabel><Pressable onPress={() => Share.share({ message: current.userId ?? '' })} style={styles.uidCard}><Text style={styles.uidLabel}>المعرّف الفريد</Text><View style={styles.uidRow}><Text selectable style={styles.uid}>{current.userId}</Text><Feather name="copy" size={16} color={colors.light.primary} /></View><Text style={styles.uidNote}>اضغط لمشاركة المعرّف أو نسخه من النص</Text></Pressable></>}

     <SectionLabel>الحسابات</SectionLabel>
     <ActionRow icon="users" title="تبديل الحسابات" description="إدارة الحسابات المحفوظة على هذا الجهاز" onPress={() => setFeedback({ title: 'تبديل الحسابات', message: 'يمكنك إضافة حساب آخر من شاشة تسجيل الدخول.' })} />
     <SectionLabel>المحفظة والخدمات</SectionLabel>
     <ActionRow icon="credit-card" title="محفظة EKN" description="أرسل واستقبل النقاط وتابع حركات محفظتك" onPress={() => router.push('/wallet')} />
    <ActionRow icon="settings" title="الإعدادات" description="تعديل الحساب واللغة والمظهر والأمان" onPress={() => router.push('/settings')} />
    <ActionRow icon="bell" title="الإشعارات" description="آخر التنبيهات والتحديثات" onPress={() => router.push('/notifications')} />
    <ActionRow icon="help-circle" title="المساعدة والدعم" description="الأسئلة الشائعة والتواصل" onPress={() => router.push('/help')} />
    <Pressable onPress={() => void Linking.openURL('https://www.instagram.com/erkan.ai')} style={styles.follow}><Feather name="instagram" size={20} color={colors.light.primary} /><Text style={styles.followText}>تابعنا على Instagram</Text><Text style={styles.followHandle}>@erkan.ai</Text></Pressable>
    <Text style={styles.footer}>ERKAN AI <Text style={styles.footerVersion}>v2.0.0</Text></Text>
   </ScrollView>{feedback && <FeedbackModal {...feedback} onClose={() => setFeedback(null)} />}</ScreenBackground>;
}

function Stat({ icon, value, label }: { icon: keyof typeof Feather.glyphMap; value: string; label: string }) { return <View style={styles.stat}><View style={styles.statIcon}><Feather name={icon} size={18} color={colors.light.primary} /></View><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.light.background, paddingHorizontal: 18 }, loading: { flex: 1, backgroundColor: colors.light.background, alignItems: 'center', justifyContent: 'center' }, topIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border },
  hero: { overflow: 'hidden', borderRadius: 23, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border }, cover: { height: 52, backgroundColor: colors.light.backgroundTop }, heroBody: { alignItems: 'center', paddingHorizontal: 18, paddingBottom: 20, marginTop: -21 }, kicker: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: 10 }, kickerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#55dfb0' }, kickerText: { color: colors.light.mutedForeground, fontSize: 9, fontWeight: '700' }, kickerSeparator: { color: '#526999', fontSize: 10 }, avatarWrap: { width: 92, height: 92, borderRadius: 32, backgroundColor: '#243b85', borderWidth: 3, borderColor: colors.light.primary, alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'visible' }, avatarImage: { width: '100%', height: '100%', borderRadius: 29 }, avatarText: { color: '#bceeff', fontSize: 34, fontWeight: '900' }, avatarOverlay: { position: 'absolute', inset: 0, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: '#06112c99' }, online: { position: 'absolute', right: -3, bottom: 2, width: 16, height: 16, borderRadius: 8, backgroundColor: '#57e0ac', borderWidth: 3, borderColor: colors.light.card }, nameRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12 }, name: { color: colors.light.foreground, fontSize: 20, fontWeight: '800' }, verifiedBadge: { padding: 2 }, handle: { color: colors.light.mutedForeground, fontSize: 11, marginTop: 4 }, bio: { color: colors.light.mutedForeground, fontSize: 11, textAlign: 'center', marginTop: 7 }, stats: { flexDirection: 'row-reverse', justifyContent: 'space-around', paddingVertical: 14, marginTop: 10, borderRadius: 17, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border }, stat: { alignItems: 'center', gap: 4, minWidth: 74 }, statIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: colors.light.primarySoft, alignItems: 'center', justifyContent: 'center' }, statValue: { color: colors.light.foreground, fontSize: 16, fontWeight: '800' }, statLabel: { color: colors.light.mutedForeground, fontSize: 10 },
  subscriptionCard: { gap: 13 }, subscriptionTop: { flexDirection: 'row-reverse', alignItems: 'center', gap: 11 }, subscriptionIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.primarySoft }, planName: { color: '#fff', fontSize: 16, fontWeight: '900', textAlign: 'right' }, planHint: { color: '#c5d4f4', fontSize: 10, textAlign: 'right', marginTop: 3 }, usage: { gap: 7 }, usageRow: { flexDirection: 'row-reverse', justifyContent: 'space-between' }, usageLabel: { color: '#d9e8ff', fontSize: 10 }, usageNumber: { color: '#fff', fontSize: 12, fontWeight: '800' }, usageLimit: { color: '#8ca3cd', fontWeight: '500' }, usageTrack: { height: 7, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.light.muted }, usageFill: { height: '100%', borderRadius: 4 }, remaining: { color: '#a9bddf', fontSize: 9, textAlign: 'right' }, planActions: { flexDirection: 'row-reverse', gap: 8 },
  uidCard: { padding: 14, borderRadius: 16, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, marginBottom: 1 }, uidLabel: { color: colors.light.mutedForeground, textAlign: 'right', fontSize: 10 }, uidRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 8 }, uid: { flex: 1, color: '#9fdbff', fontSize: 13, letterSpacing: 1, textAlign: 'left' }, uidNote: { color: '#6176a7', fontSize: 9, textAlign: 'right', marginTop: 7 }, follow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 14, marginTop: 14, borderRadius: 15, backgroundColor: colors.light.surfaceOverlay, borderWidth: 1, borderColor: colors.light.border }, followText: { color: colors.light.foreground, fontSize: 11, fontWeight: '800' }, followHandle: { color: colors.light.primary, fontSize: 10 }, footer: { color: colors.light.mutedForeground, textAlign: 'center', fontSize: 10, marginTop: 22 }, footerVersion: { color: '#536a9e' },
});
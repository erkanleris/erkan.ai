import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { GlowCard, Pill, PrimaryButton, TopBar } from '@/components/MobileChrome';
import colors from '@/constants/colors';
import { getSubscriptionStatus, getWallet, purchaseSubscriptionWithWallet, type SubscriptionStatus, type WalletSummary } from '@/lib/mobile-api';
import { useAuth } from '@/contexts/AuthContext';
import { isRevenueCatAvailable, purchaseGooglePlaySubscription } from '@/lib/revenuecat';
import { FeedbackModal } from '@/components/FeedbackModal';
import { ConfirmationSheet } from '@/components/ConfirmationSheet';
import { useMobileLocale } from '@/contexts/LocaleContext';

const plans = [
  { id: 'free' as const, title: 'درويش', price: 0, accent: 'blue' as const, intro: '🆓 درويش\n\nمبسوط انك مجاني 😂\nخلي على البركة تحلم فيك شوي 😎', features: ['30 رسالة يومياً', 'دعم اللغة العربية', 'محادثات أساسية'] },
  { id: 'pro' as const, title: 'على البركة', price: 1500, accent: 'blue' as const, intro: '🔥 على البركة\n\nطلعت من الدرويش بس لسا الطريق طويل 😂\nالمطنوخ فوقك وعم يستناك 👑', features: ['120 رسالة يومياً', 'رفع الملفات والصور', 'أولوية في الردود', 'أدوات متقدمة'] },
  { id: 'pro_max' as const, title: 'مطنوخ', price: 3600, accent: 'purple' as const, intro: '👑 مطنوخ\n\nالدرويش يحسبها وعلى البركة يجرب 😂\nوانت داخل تاخد كل شي وكأن التطبيق باسمك 😎🔥', features: ['10,000 رسالة يومياً', 'توليد الصور', 'أولوية قصوى', 'كل الأدوات والدعم المميز'] },
];
const durations = [30, 60, 90] as const;

export default function PlansScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t } = useMobileLocale();
  const [selected, setSelected] = useState<'free' | 'pro' | 'pro_max'>('pro');
  const [duration, setDuration] = useState<(typeof durations)[number]>(30);
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [buyingGoogle, setBuyingGoogle] = useState(false);
  const [purchaseConfirm, setPurchaseConfirm] = useState<'wallet' | 'google' | null>(null);
  const [feedback, setFeedback] = useState<{ title: string; message: string } | null>(null);
  const planTitle = (id: 'free' | 'pro' | 'pro_max') => id === 'free' ? t('freePlan') : id === 'pro' ? t('proPlan') : t('promaxPlan');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [subscription, walletSummary] = await Promise.all([getSubscriptionStatus(), getWallet()]);
      setStatus(subscription);
      setWallet(walletSummary);
      if (subscription.plan === 'pro' || subscription.plan === 'pro_max') setSelected(subscription.plan);
    } catch (error) {
      setFeedback({ title: 'تعذر تحميل الخطط', message: error instanceof Error ? error.message : 'حاول مرة أخرى.' });
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const buyWithWallet = async () => {
    if (selected === 'free') return;
    setBuying(true);
    try {
      const result = await purchaseSubscriptionWithWallet(selected, duration);
      setWallet(current => current ? { ...current, balance: result.balance } : current);
      setFeedback({ title: 'تم تسجيل الشراء', message: `تم خصم ${result.cost.toLocaleString('ar-EG')} EKN وإصدار كود ${result.code}. فعّل الكود الآن لتطبيق الخطة.` });
    } catch (error) {
      setFeedback({ title: 'تعذر شراء الاشتراك', message: error instanceof Error ? error.message : 'تحقق من رصيد EKN وحاول مرة أخرى.' });
    } finally {
      setBuying(false);
      setPurchaseConfirm(null);
    }
  };

  const buyWithGooglePlay = async () => {
    if (!isRevenueCatAvailable()) {
      setFeedback({ title: 'Google Play غير مهيأ', message: 'أضف منتجات Google Play ومفتاح RevenueCat لتفعيل الشراء داخل التطبيق.' });
      setPurchaseConfirm(null);
      return;
    }
    setBuyingGoogle(true);
    try {
      await purchaseGooglePlaySubscription(selected as 'pro' | 'pro_max', duration, user?.userId ?? String(user?.id ?? ''));
      setFeedback({ title: 'تم الشراء', message: 'تمت معالجة الدفع عبر Google Play وحفظ رقم العملية للمراجعة.' });
      await load();
    } catch (error) {
      setFeedback({ title: 'تعذر إتمام الدفع', message: error instanceof Error ? error.message : 'تحقق من حساب Google Play وحاول مرة أخرى.' });
    } finally {
      setBuyingGoogle(false);
      setPurchaseConfirm(null);
    }
  };

  return (
    <>
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 25 }}>
      <TopBar title={t('plansTitle')} subtitle={t('plansSub')} />
      {loading ? <ActivityIndicator color={colors.light.primary} style={styles.loader} /> : <>
        <GlowCard accent={status?.plan === 'pro_max' ? 'purple' : 'blue'} style={styles.current}>
          <View style={styles.currentTop}><Pill tone={status?.plan === 'pro_max' ? 'purple' : 'blue'}>{status?.plan === 'free' ? 'درويش' : status?.plan === 'pro' ? 'على البركة' : 'مطنوخ'}</Pill><Text style={styles.currentLabel}>الخطة الحالية</Text></View>
           <Text style={styles.currentText}>{status?.plan === 'free' ? t('upgradeHint') : t('dailyUsage')}</Text>
          {status?.expiresAt && <Text style={styles.expiry}>ينتهي في {new Date(status.expiresAt).toLocaleDateString('ar-EG')}</Text>}
        </GlowCard>
        {plans.map(plan => {
          const isCurrent = status?.plan === plan.id;
          return <View key={plan.id} style={[styles.planWrap, isCurrent && styles.selected]}>
            <GlowCard accent={plan.accent} style={styles.plan}>
               <View style={styles.planHeader}><Pill tone={plan.id === 'pro_max' ? 'purple' : 'blue'}>{planTitle(plan.id)}</Pill><View style={styles.price}><Text style={styles.priceNumber}>{plan.price === 0 ? planTitle('free') : `${plan.price.toLocaleString('en-US')} EKN`}</Text><Text style={styles.currency}>{plan.id === 'free' ? '' : ` / ${t('walletDays', { days: 30 })}`}</Text></View></View>
              <Text style={styles.planIntro}>{plan.intro}</Text>
              {plan.features.map(feature => <View key={feature} style={styles.feature}><Feather name="check-circle" size={16} color={colors.light.primary} /><Text style={styles.featureText}>{feature}</Text></View>)}
              <Pressable disabled={isCurrent && plan.id === 'free'} onPress={() => plan.id === 'free' ? router.back() : router.push('/activate')} style={[styles.planAction, isCurrent && styles.planActionCurrent]}>
                 <Text style={[styles.planActionText, isCurrent && styles.planActionCurrentText]}>{isCurrent ? t('currPlanBtn') : plan.id === 'free' ? t('back') : t('upgradePlan')}</Text>
              </Pressable>
            </GlowCard>
          </View>;
        })}
         {selected !== 'free' && <View style={styles.purchaseBox}>
           <Text style={styles.purchaseTitle}>شراء الخطة المختارة</Text>
           <View style={styles.durationRow}>{durations.map(days => <Pressable key={days} onPress={() => setDuration(days)} style={[styles.duration, duration === days && styles.durationSelected]}><Text style={[styles.durationText, duration === days && styles.durationTextSelected]}>{days} يوم</Text></Pressable>)}</View>
           <Text style={styles.balance}>رصيدك: {wallet?.balance?.toLocaleString('ar-EG') ?? '0'} EKN</Text>
           <Pressable disabled={buying || buyingGoogle} onPress={() => setPurchaseConfirm('wallet')} style={[styles.googleButton, (buying || buyingGoogle) && { opacity: 0.5 }]}><Feather name="credit-card" size={16} color="#fff" /><Text style={styles.googleText}>{buying ? 'جارٍ الشراء...' : 'الشراء برصيد EKN'}</Text></Pressable>
           <Pressable disabled={buying || buyingGoogle} onPress={() => setPurchaseConfirm('google')} style={[styles.googleButton, { backgroundColor: colors.light.primary }, (buying || buyingGoogle) && { opacity: 0.5 }]}><Feather name="smartphone" size={16} color="#fff" /><Text style={styles.googleText}>{buyingGoogle ? 'جارٍ الدفع...' : 'الدفع عبر Google Play'}</Text></Pressable>
         </View>}
        <Pressable onPress={() => router.push('/activate')} style={styles.codeLink}><Feather name="key" size={16} color={colors.light.primary} /><Text style={styles.codeText}>لديك كود تفعيل؟</Text></Pressable>
      </>}
    </ScrollView>
    <ConfirmationSheet visible={Boolean(purchaseConfirm)} title="تأكيد شراء الخطة" message={`سيتم شراء خطة ${plans.find(plan => plan.id === selected)?.title ?? ''} لمدة ${duration} يوماً.`} confirmLabel="شراء الآن" busy={buying || buyingGoogle} onCancel={() => setPurchaseConfirm(null)} onConfirm={() => { if (purchaseConfirm === 'wallet') void buyWithWallet(); else if (purchaseConfirm === 'google') void buyWithGooglePlay(); }} />
    {feedback && <FeedbackModal {...feedback} action={feedback.title === 'تم تسجيل الشراء' ? () => router.push('/activate') : undefined} actionLabel="تفعيل الآن" onClose={() => setFeedback(null)} />}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 18 },
  loader: { marginTop: 60 },
  current: { gap: 8, marginBottom: 13 },
  currentTop: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  currentLabel: { color: colors.light.secondaryForeground, fontSize: 13, fontWeight: '800' },
  currentText: { color: colors.light.mutedForeground, fontSize: 11, textAlign: 'right' },
  expiry: { color: colors.light.accentForeground, fontSize: 10, textAlign: 'right' },
  planWrap: { borderRadius: colors.radius, marginBottom: 12, borderWidth: 2, borderColor: 'transparent' },
  selected: { borderColor: colors.light.primary },
  plan: { gap: 12 },
  planHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  planIntro: { color: colors.light.secondaryForeground, fontSize: 12, lineHeight: 21, textAlign: 'right', writingDirection: 'rtl' },
  price: { flexDirection: 'row-reverse', alignItems: 'baseline' },
  priceNumber: { color: '#fff', fontSize: 18, fontWeight: '900' },
  currency: { color: colors.light.mutedForeground, fontSize: 9 },
  feature: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8 },
  featureText: { color: colors.light.secondaryForeground, fontSize: 12 },
  planAction: { minHeight: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 5, backgroundColor: colors.light.primary },
  planActionCurrent: { backgroundColor: colors.light.muted, borderWidth: 1, borderColor: colors.light.border },
  planActionText: { color: colors.light.primaryForeground, fontSize: 12, fontWeight: '800' },
  planActionCurrentText: { color: colors.light.mutedForeground },
  purchaseBox: { gap: 12, padding: 16, borderRadius: 18, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border },
  purchaseTitle: { color: colors.light.foreground, fontSize: 13, fontWeight: '800', textAlign: 'right' },
  durationRow: { flexDirection: 'row-reverse', gap: 8 },
  duration: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 12, backgroundColor: colors.light.background, borderWidth: 1, borderColor: colors.light.border },
  durationSelected: { backgroundColor: colors.light.primarySoft, borderColor: colors.light.primary },
  durationText: { color: colors.light.mutedForeground, fontSize: 11, fontWeight: '700' },
  durationTextSelected: { color: '#fff' },
  balance: { color: colors.light.accentForeground, fontSize: 11, textAlign: 'right' },
  googleButton: { minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 8, backgroundColor: colors.light.secondary, borderWidth: 1, borderColor: colors.light.primary },
  googleText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  codeLink: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 7, padding: 14 },
  codeText: { color: colors.light.primary, fontSize: 12, fontWeight: '700' },
});
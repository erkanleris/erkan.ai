import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { GlowCard, Pill, PrimaryButton, TopBar } from '@/components/MobileChrome';
import colors from '@/constants/colors';
import { activateSubscriptionCode, getMe } from '@/lib/mobile-api';
import { useAuth } from '@/contexts/AuthContext';
import { FeedbackModal } from '@/components/FeedbackModal';

export default function ActivateScreen() {
  const router = useRouter();
  const { plan } = useLocalSearchParams<{ plan?: string }>();
  const insets = useSafeAreaInsets();
  const { updateUser } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [feedback, setFeedback] = useState<{ title: string; message: string } | null>(null);
  const activationPlan = plan === 'pro_max' ? 'pro_max' : plan === 'pro' ? 'pro' : null;

  const activate = async () => {
    const cleanCode = code.trim().replace(/-/g, '').toUpperCase();
    if (cleanCode.length !== 16) {
      setFeedback({ title: 'كود غير مكتمل', message: 'أدخل كود التفعيل المكون من 16 حرفاً ورقماً.' });
      return;
    }
    setLoading(true);
    try {
      const result = await activateSubscriptionCode(cleanCode);
      updateUser(await getMe());
      setSuccess(true);
      setFeedback({ title: 'تم التفعيل', message: `تم تفعيل ${result.planName} لمدة ${result.durationDays} يوماً.` });
    } catch (error) {
      setFeedback({ title: 'تعذر التفعيل', message: error instanceof Error ? error.message : 'حاول مرة أخرى.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 }]}>
      <TopBar title="تفعيل الاشتراك" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">{success ? (
        <View style={styles.success}>
          <View style={styles.successIcon}><Feather name="check" size={34} color="#fff" /></View>
          <Text style={styles.successTitle}>تم التفعيل بنجاح</Text>
          <Text style={styles.successText}>تم تحديث خطة حسابك ويمكنك متابعة الاستخدام الآن.</Text>
          <PrimaryButton onPress={() => router.replace('/chat')}>العودة للرئيسية</PrimaryButton>
        </View>
      ) : (
        <View style={styles.body}>
          <GlowCard accent="purple" style={styles.hero}>
             <Pill tone={activationPlan === 'pro' ? 'blue' : 'purple'}>{activationPlan === 'pro' ? 'على البركة' : activationPlan === 'pro_max' ? 'مطنوخ' : 'على البركة / مطنوخ'}</Pill>
            <Text style={styles.heroTitle}>افتح كامل قدرات ERKAN AI</Text>
            <Text style={styles.heroText}>أدخل كود التفعيل المكون من 16 حرفاً للمتابعة.</Text>
          </GlowCard>
           {activationPlan && <View style={[styles.planMessage, activationPlan === 'pro_max' && styles.planMessageMax]}>
             <View style={styles.planMessageGlow} />
             <Text style={styles.planMessageIcon}>{activationPlan === 'pro' ? '🔥' : '👑'}</Text>
             <View style={styles.planMessageCopy}>
               <Text style={styles.planMessageTitle}>{activationPlan === 'pro' ? '🔥 على البركة' : '👑 مطنوخ'}</Text>
               <Text style={styles.planMessageLine}>{activationPlan === 'pro' ? 'يا سلام على الاختيار 😂🔥' : 'أوووه هيك الاختيارات ولا بلاش 👑🔥'}</Text>
               <Text style={styles.planMessageLine}>{activationPlan === 'pro' ? 'واضح إنك ما بترضى بنص تجربة' : 'اختيارك فخم ويقول إنك تعرف تختار الصح'}</Text>
             </View>
           </View>}
          <Text style={styles.label}>كود التفعيل</Text>
          <TextInput
            value={code}
            onChangeText={value => setCode(value.replace(/[^a-z0-9-]/gi, '').slice(0, 19))}
            placeholder="XXXX-XXXX-XXXX-XXXX"
            placeholderTextColor={colors.light.mutedForeground}
            autoCapitalize="characters"
            style={styles.input}
          />
          <PrimaryButton onPress={() => void activate()}>{loading ? 'جار التحقق...' : 'تفعيل الكود'}</PrimaryButton>
          <Pressable onPress={() => router.back()} style={styles.cancel}><Text style={styles.cancelText}>العودة إلى الخطط</Text></Pressable>
          {loading && <ActivityIndicator color={colors.light.primary} style={{ marginTop: 18 }} />}
        </View>
      )}</ScrollView>
      {feedback && <FeedbackModal {...feedback} onClose={() => setFeedback(null)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 18 },
  scrollContent: { flexGrow: 1, paddingBottom: 20 }, body: { gap: 14 },
  hero: { gap: 10, marginBottom: 12 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '900', textAlign: 'right' },
  heroText: { color: '#c5b9ed', fontSize: 12, lineHeight: 21, textAlign: 'right' },
  planMessage: { position: 'relative', overflow: 'hidden', flexDirection: 'row-reverse', alignItems: 'center', gap: 11, padding: 15, borderRadius: 20, backgroundColor: 'rgba(25, 117, 220, 0.18)', borderWidth: 1, borderColor: 'rgba(91, 183, 255, 0.62)', shadowColor: '#2da9ff', shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 6 },
  planMessageMax: { backgroundColor: 'rgba(132, 57, 209, 0.2)', borderColor: 'rgba(206, 139, 255, 0.68)', shadowColor: '#b15cff' },
  planMessageGlow: { position: 'absolute', width: 86, height: 86, left: -22, top: -30, borderRadius: 50, backgroundColor: 'rgba(105, 208, 255, 0.2)' },
  planMessageIcon: { fontSize: 27 },
  planMessageCopy: { flex: 1, gap: 3 },
  planMessageTitle: { color: '#fff', fontSize: 15, fontWeight: '900', textAlign: 'right' },
  planMessageLine: { color: '#d4e5ff', fontSize: 11, lineHeight: 18, textAlign: 'right' },
  label: { color: colors.light.mutedForeground, fontSize: 11, fontWeight: '700', textAlign: 'right' },
  input: { height: 55, borderRadius: 15, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card, color: colors.light.foreground, textAlign: 'center', letterSpacing: 2, fontSize: 15 },
  cancel: { alignItems: 'center', padding: 10 },
  cancelText: { color: colors.light.mutedForeground, fontSize: 12 },
  success: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 20 },
  successIcon: { width: 76, height: 76, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#168d6e' },
  successTitle: { color: colors.light.foreground, fontSize: 22, fontWeight: '900' },
  successText: { color: colors.light.mutedForeground, fontSize: 12, marginBottom: 12 },
});
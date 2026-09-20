import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { ActionRow, GlowCard, SectionLabel, TopBar } from '@/components/MobileChrome';
import colors from '@/constants/colors';
const faqs = [
  ['كيف أستخدم ERKAN AI؟', 'اكتب سؤالك في المحادثة، ويمكنك اختيار إحدى الأدوات أو رفع ملف عند الحاجة.'],
  ['ما الخطط المتاحة؟', 'راجع صفحة الخطط لمعرفة المزايا والحدود لكل خطة.'],
  ['كيف أستخدم المحفظة؟', 'يمكنك إيداع الأكواد وتحويل EKN إلى معرف LMR صالح.'],
  ['هل تحفظون محادثاتي؟', 'يمكنك التحكم في الاحتفاظ بالبيانات وحذف سجل المحادثات من إعدادات الخصوصية.'],
];

type ServiceStatus = 'checking' | 'online' | 'offline';

export default function HelpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(0);
  const [status, setStatus] = useState<ServiceStatus>('checking');
  const [mailError, setMailError] = useState('');

  useEffect(() => {
    let active = true;
    const origin = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : '';
    fetch(`${origin}/api/healthz`)
      .then(response => { if (active) setStatus(response.ok ? 'online' : 'offline'); })
      .catch(() => { if (active) setStatus('offline'); });
    return () => { active = false; };
  }, []);

  const contact = async (subject: string) => {
    setMailError('');
    const url = `mailto:support@erkan.ai?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent('مرحباً،\n\nتفاصيل الطلب:\n')}`;
    try { await Linking.openURL(url); } catch { setMailError('تعذر فتح البريد. أضف تطبيق بريد إلكتروني لإرسال رسالتك.'); }
  };

  const statusTitle = status === 'checking' ? 'جاري فحص الخدمة' : status === 'online' ? 'الخدمة تعمل بشكل طبيعي' : 'الخدمة تواجه مشكلة';
  const statusText = status === 'checking' ? 'نتحقق من حالة الخادم...' : status === 'online' ? 'الخدمة متاحة الآن' : 'حاول مرة أخرى بعد قليل';

  return <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}>
    <TopBar title="المساعدة والدعم" subtitle="نحن هنا لمساعدتك" />
    <GlowCard accent={status === 'offline' ? 'purple' : 'teal'} style={styles.status}>
      <View style={[styles.statusIcon, status === 'offline' && styles.statusOffline]}><Feather name={status === 'checking' ? 'loader' : status === 'online' ? 'server' : 'alert-triangle'} size={19} color={status === 'offline' ? colors.light.destructive : '#55dfb0'} /></View>
      <View style={styles.statusCopy}><Text style={styles.statusTitle}>{statusTitle}</Text><Text style={styles.statusText}>{statusText}</Text></View>
      <View style={[styles.statusPill, status === 'online' ? styles.statusPillOnline : status === 'offline' ? styles.statusPillOffline : styles.statusPillChecking]}><Text style={styles.statusPillText}>{status === 'checking' ? '...' : status === 'online' ? 'متصل' : 'غير متصل'}</Text></View>
    </GlowCard>
    <SectionLabel>الأسئلة الشائعة</SectionLabel>
    {faqs.map(([question, answer], index) => <Pressable key={question} onPress={() => setOpen(open === index ? -1 : index)} style={styles.faq}><View style={styles.faqHeader}><Text style={styles.question}>{question}</Text><Feather name={open === index ? 'chevron-up' : 'chevron-down'} size={17} color={colors.light.primary} /></View>{open === index && <Text style={styles.answer}>{answer}</Text>}</Pressable>)}
    <SectionLabel>تواصل معنا</SectionLabel>
    <ActionRow icon="alert-triangle" title="الإبلاغ عن مشكلة" description="إرسال تفاصيل المشكلة إلى فريق الدعم" onPress={() => void contact('بلاغ عن مشكلة في ERKAN AI')} />
    <ActionRow icon="message-square" title="التواصل مع الدعم" description="support@erkan.ai" onPress={() => void contact('طلب دعم ERKAN AI')} />
    <ActionRow icon="shield" title="الخصوصية والأمان" description="راجع إعدادات حماية بياناتك" onPress={() => router.push('/privacy')} />
    {mailError ? <Text style={styles.mailError}>{mailError}</Text> : null}
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 18 },
  status: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12 },
  statusIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.teal },
  statusOffline: { backgroundColor: '#401b2d' },
  statusCopy: { flex: 1 },
  statusTitle: { color: colors.light.foreground, fontSize: 13, fontWeight: '800', textAlign: 'right' },
  statusText: { color: colors.light.mutedForeground, fontSize: 10, textAlign: 'right', marginTop: 3 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10 },
  statusPillOnline: { backgroundColor: '#1f7f6333' },
  statusPillOffline: { backgroundColor: '#b3415133' },
  statusPillChecking: { backgroundColor: colors.light.primarySoft },
  statusPillText: { color: colors.light.foreground, fontSize: 9, fontWeight: '800' },
  faq: { padding: 15, borderRadius: colors.radius, backgroundColor: colors.light.surfaceOverlay, borderWidth: 1, borderColor: colors.light.border, marginBottom: 8 },
  faqHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  question: { flex: 1, color: colors.light.foreground, textAlign: 'right', fontSize: 12, fontWeight: '700' },
  answer: { color: colors.light.mutedForeground, textAlign: 'right', fontSize: 11, lineHeight: 20, marginTop: 10 },
  mailError: { color: colors.light.destructive, textAlign: 'right', fontSize: 11, marginTop: 4 },
});
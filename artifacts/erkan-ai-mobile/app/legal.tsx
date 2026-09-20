import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import colors from '@/constants/colors';

const privacySections = [
  ['ما الذي نجمعه؟', 'نجمع بيانات الحساب التي تقدمها، ومحتوى المحادثات والملفات التي ترسلها، وسجلات الأمان اللازمة لحماية الحساب.'],
  ['كيف نستخدم البيانات؟', 'نستخدم البيانات لتسجيل الدخول، وتشغيل المساعد، وتطبيق حدود الخطط، ومعالجة معاملات EKN، واكتشاف محاولات الدخول غير المعتادة.'],
  ['التخزين والحماية', 'نحفظ البيانات في قاعدة بيانات محمية ونقيّد الوصول إليها حسب الحاجة التشغيلية.'],
  ['حقوقك', 'يمكنك تصدير بياناتك، حذف سجل المحادثات، تعديل إعدادات الاحتفاظ، أو حذف الحساب نهائياً من قسم الخصوصية والأمان.'],
];
const termsSections = [
  ['الحساب والمسؤولية', 'يجب تقديم معلومات صحيحة وحماية بيانات الدخول. أنت مسؤول عن النشاط الذي يتم من حسابك.'],
  ['الاستخدام المقبول', 'يُمنع استخدام الخدمة للتحايل على الحدود، أو انتهاك حقوق الآخرين، أو إرسال محتوى غير قانوني أو ضار.'],
  ['مخرجات الذكاء الاصطناعي', 'الردود آلية وقد تحتوي على أخطاء. راجع المعلومات المهمة ولا تعتمد على ERKAN AI وحده في القرارات الطبية أو القانونية أو المالية.'],
  ['التحديثات', 'قد نحدّث هذه الشروط عند الحاجة. استمرارك في الاستخدام بعد نشر تحديث واضح يعني موافقتك على النسخة الجديدة.'],
];

export default function LegalScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const privacy = kind !== 'terms';
  const sections = privacy ? privacySections : termsSections;
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 14, paddingBottom: insets.bottom + 28 }}>
      <View style={styles.header}><Pressable onPress={() => router.back()} style={styles.back}><Feather name="arrow-right" size={20} color={colors.light.foreground} /></Pressable><View style={styles.heading}><View style={styles.mark}><Feather name={privacy ? 'shield' : 'file-text'} size={19} color={colors.light.primary} /></View><View><Text style={styles.title}>{privacy ? 'سياسة الخصوصية' : 'شروط الاستخدام'}</Text><Text style={styles.version}>الإصدار الحالي · ERKAN AI</Text></View></View></View>
      <View style={styles.hero}><Text style={styles.heroTitle}>{privacy ? 'خصوصيتك مسؤولية نلتزم بها' : 'استخدم ERKAN AI بمسؤولية'}</Text><Text style={styles.heroText}>{privacy ? 'نستخدم بياناتك لتشغيل ERKAN AI وتحسين تجربتك، ونمنحك أدوات واضحة للتحكم بها.' : 'باستخدام التطبيق، تقرأ هذه الشروط وتوافق على الالتزام بها.'}</Text></View>
      {sections.map(([title, text]) => <View style={styles.section} key={title}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionText}>{text}</Text></View>)}
      <Text style={styles.footer}>للاستفسارات المتعلقة بالخصوصية أو الشروط، تواصل مع فريق الدعم من داخل التطبيق.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 18 },
  header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, marginBottom: 20 },
  back: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border },
  heading: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  mark: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#132e5a' },
  title: { color: colors.light.foreground, fontSize: 17, fontWeight: '800', textAlign: 'right' },
  version: { color: colors.light.mutedForeground, fontSize: 10, textAlign: 'right', marginTop: 3 },
  hero: { padding: 18, borderRadius: 19, backgroundColor: '#11275a', borderWidth: 1, borderColor: '#2652a0', marginBottom: 16 },
  heroTitle: { color: '#fff', fontSize: 15, fontWeight: '800', textAlign: 'right' },
  heroText: { color: '#9ebcf0', fontSize: 12, lineHeight: 21, textAlign: 'right', marginTop: 6 },
  section: { padding: 16, borderRadius: 16, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, marginBottom: 10 },
  sectionTitle: { color: colors.light.foreground, fontSize: 13, fontWeight: '800', textAlign: 'right' },
  sectionText: { color: colors.light.mutedForeground, fontSize: 12, lineHeight: 21, textAlign: 'right', marginTop: 6 },
  footer: { color: colors.light.mutedForeground, fontSize: 11, lineHeight: 20, textAlign: 'right', marginTop: 10 },
});
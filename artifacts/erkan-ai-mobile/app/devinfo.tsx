import React from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { TopBar } from '@/components/MobileChrome';
import colors from '@/constants/colors';
import { AnimatedErkanLogo } from '@/components/AnimatedErkanLogo';

const INSTAGRAM = 'https://www.instagram.com/erkan.ai';

export default function DevInfoScreen() {
  const insets = useSafeAreaInsets();
  return <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}>
    <TopBar title="معلومات المطور" />
    <View style={styles.hero}><AnimatedErkanLogo size={82} testID="developer-logo" /><Text style={styles.name}>ERKAN AI</Text><Text style={styles.tag}>ذكاء عربي بلا حدود</Text><Text style={styles.by}>by TRSY</Text></View>
    <Text style={styles.section}>عن المشروع</Text>
    <View style={styles.about}><Text style={styles.aboutText}>ERKAN AI هو مساعد عربي ذكي صُمم ليمنحك تجربة محادثة متطورة، سريعة وخصوصية بياناتك فيها أولوية.</Text></View>
    <Text style={styles.section}>الفريق</Text>
    <View style={styles.infoCard}>
      <Info icon="tag" label="اسم الفريق" value="TRSY" />
      <Info icon="award" label="قائد الفريق" value="أركان لياريش" />
      <Info icon="users" label="عدد الأعضاء" value="6 أعضاء" />
      <Info icon="star" label="اسم المشروع" value="ERKAN AI" last />
    </View>
    <Text style={styles.section}>تواصل معنا</Text>
    <Pressable onPress={() => void Linking.openURL(INSTAGRAM)} style={styles.contact}><Feather name="instagram" size={22} color={colors.light.primary} /><View style={{ flex: 1 }}><Text style={styles.contactTitle}>الحساب الرسمي</Text><Text style={styles.handle}>@erkan.ai</Text></View><Feather name="external-link" size={16} color={colors.light.mutedForeground} /></Pressable>
    <Text style={styles.footer}>جميع الحقوق محفوظة لـ TRSY{'\n'}ERKAN AI v2.0</Text>
  </ScrollView>;
}

function Info({ icon, label, value, last }: { icon: keyof typeof Feather.glyphMap; label: string; value: string; last?: boolean }) {
  return <View style={[styles.row, !last && styles.rowBorder]}><Text style={styles.value}>{value}</Text><View style={styles.rowLeft}><View style={styles.icon}><Feather name={icon} size={16} color={colors.light.primary} /></View><Text style={styles.label}>{label}</Text></View></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.light.background, paddingHorizontal: 18 },
  hero: { alignItems: 'center', paddingVertical: 25, borderRadius: 22, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border },
  name: { color: colors.light.foreground, fontSize: 21, fontWeight: '900', letterSpacing: 3, marginTop: 12 }, tag: { color: colors.light.mutedForeground, fontSize: 11, marginTop: 5 }, by: { color: colors.light.primary, fontSize: 10, marginTop: 13, fontWeight: '700' },
  section: { color: colors.light.mutedForeground, textAlign: 'right', fontSize: 11, fontWeight: '800', marginTop: 22, marginBottom: 9 },
  about: { padding: 16, borderRadius: 16, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border }, aboutText: { color: colors.light.foreground, textAlign: 'right', fontSize: 12, lineHeight: 22 },
  infoCard: { paddingHorizontal: 14, borderRadius: 16, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border },
  row: { minHeight: 57, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' }, rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.light.borderSubtle }, rowLeft: { flexDirection: 'row-reverse', alignItems: 'center', gap: 9 }, icon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.light.blueSurface, alignItems: 'center', justifyContent: 'center' }, label: { color: colors.light.mutedForeground, fontSize: 11 }, value: { color: colors.light.foreground, fontSize: 12, fontWeight: '700' },
  contact: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, padding: 15, borderRadius: 16, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border }, contactTitle: { color: colors.light.foreground, fontSize: 12, fontWeight: '800', textAlign: 'right' }, handle: { color: colors.light.primary, fontSize: 11, marginTop: 3, textAlign: 'right' }, footer: { color: colors.light.mutedForeground, textAlign: 'center', fontSize: 10, lineHeight: 18, marginTop: 26 },
});
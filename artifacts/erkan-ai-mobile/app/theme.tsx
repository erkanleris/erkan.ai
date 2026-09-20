import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { TopBar } from '@/components/MobileChrome';

export default function ThemeScreen() {
  const insets = useSafeAreaInsets();
  const { theme, themeId, options, setTheme } = useTheme();
  return <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}>
    <TopBar title="المظهر" subtitle="خصّص شكل ERKAN AI" />
    <View style={[styles.intro, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={[styles.introIcon, { backgroundColor: theme.primary }]}><Feather name="grid" size={20} color={theme.primaryForeground} /></View>
      <View style={styles.introCopy}><Text style={[styles.introTitle, { color: theme.foreground }]}>خصّص تجربة ERKAN AI</Text><Text style={[styles.introDetail, { color: theme.mutedForeground }]}>{options.find(option => option.id === themeId)?.title ?? 'المظهر الحالي'}</Text></View>
      <Feather name="check" size={17} color={theme.primary} />
    </View>
    <View style={styles.sectionHeading}><Text style={[styles.sectionTitle, { color: theme.foreground }]}>المظاهر المتاحة</Text><Text style={[styles.sectionCount, { color: theme.mutedForeground }]}>{options.length} خياراً</Text></View>
    {options.map(option => <Pressable key={option.id} onPress={() => void setTheme(option.id)} style={[styles.theme, { backgroundColor: theme.card, borderColor: theme.border }, themeId === option.id && { borderColor: theme.primary, shadowColor: theme.primary, shadowOpacity: 0.25, shadowRadius: 8 }]}>
      <View style={[styles.preview, { backgroundColor: option.preview }]}><View style={[styles.previewGlow, { backgroundColor: theme.primary }]} /></View>
      <View style={styles.themeText}><Text style={[styles.title, { color: theme.foreground }]}>{option.title}</Text><Text style={[styles.detail, { color: theme.mutedForeground }]}>{option.detail}</Text></View>
      <View style={[styles.radio, { borderColor: theme.border }]}>{themeId === option.id && <View style={[styles.radioDot, { backgroundColor: theme.primary }]} />}</View>
    </Pressable>)}
    <Text style={[styles.note, { color: theme.mutedForeground }]}>يتم حفظ اختيارك على الجهاز ويُطبّق فوراً على عناصر التطبيق الأساسية.</Text>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 18 },
  theme: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, padding: 11, borderRadius: 18, borderWidth: 1, marginBottom: 10 },
  intro: { flexDirection: 'row-reverse', alignItems: 'center', gap: 11, padding: 13, borderRadius: 18, borderWidth: 1, marginBottom: 18 },
  introIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  introCopy: { flex: 1 },
  introTitle: { textAlign: 'right', fontSize: 13, fontWeight: '800' },
  introDetail: { textAlign: 'right', fontSize: 10, marginTop: 4 },
  sectionHeading: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { textAlign: 'right', fontSize: 13, fontWeight: '800' },
  sectionCount: { fontSize: 10 },
  preview: { width: 58, height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  previewGlow: { width: 25, height: 25, borderRadius: 13, opacity: 0.8 },
  themeText: { flex: 1 },
  title: { textAlign: 'right', fontSize: 13, fontWeight: '800' },
  detail: { textAlign: 'right', fontSize: 10, marginTop: 4 },
  radio: { width: 21, height: 21, borderRadius: 11, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 11, height: 11, borderRadius: 6 },
  note: { textAlign: 'center', fontSize: 10, lineHeight: 18, marginTop: 18 },
});
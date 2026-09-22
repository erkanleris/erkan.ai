import React, { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import colors from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

export function ScreenBackground({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.backgroundRoot, { backgroundColor: theme.background }]}>
      <LinearGradient
        pointerEvents="none"
        colors={[theme.backgroundTop, theme.backgroundBottom, theme.background]}
        locations={[0, 0.48, 1]}
        style={styles.backgroundGradient}
      />
      <View pointerEvents="none" style={[styles.backgroundGlow, { backgroundColor: theme.primarySoft }]} />
      {children}
    </View>
  );
}

export function TopBar({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const router = useRouter();
  const { theme } = useTheme();
  return (
    <View style={styles.topBar}>
      <Pressable onPress={() => router.back()} style={[styles.iconButton, { backgroundColor: theme.card, borderColor: theme.border }]}><Feather name="arrow-right" size={20} color={theme.foreground} /></Pressable>
      <View style={styles.topTitle}><Text style={[styles.title, { color: theme.foreground }]}>{title}</Text>{subtitle && <Text style={[styles.subtitle, { color: theme.mutedForeground }]}>{subtitle}</Text>}</View>
      {right ?? <View style={styles.iconButtonGhost} />}
    </View>
  );
}

export function GlowCard({ children, accent = 'blue', style }: { children: ReactNode; accent?: 'blue' | 'purple' | 'teal'; style?: object }) {
  const { theme } = useTheme();
  const accentColor = accent === 'purple' ? theme.accent : accent === 'teal' ? theme.teal : theme.primary;
  return (
    <View
      style={[
        styles.glowCard,
        { borderColor: `${accentColor}55`, backgroundColor: theme.surfaceOverlay },
        style,
      ]}
    >
      <View pointerEvents="none" style={[styles.cardGlow, { backgroundColor: `${accentColor}18` }]} />
      {children}
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function ActionRow({ icon, title, description, onPress, danger = false, trailing }: { icon: keyof typeof Feather.glyphMap; title: string; description?: string; onPress?: () => void; danger?: boolean; trailing?: ReactNode }) {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionRow, { backgroundColor: theme.card, borderColor: theme.border }, pressed && { opacity: 0.72 }]}>
      <View style={[styles.rowIcon, { backgroundColor: theme.secondary }, danger && styles.dangerIcon]}><Feather name={icon} size={18} color={danger ? theme.destructive : theme.primary} /></View>
      <View style={styles.rowText}><Text style={[styles.rowTitle, { color: danger ? theme.destructive : theme.foreground }]}>{title}</Text>{description && <Text style={[styles.rowDescription, { color: theme.mutedForeground }]}>{description}</Text>}</View>
      {trailing ?? <Feather name="chevron-left" size={18} color={theme.mutedForeground} />}
    </Pressable>
  );
}

export function Pill({ children, tone = 'blue' }: { children: string; tone?: 'blue' | 'purple' | 'green' }) {
  const style = tone === 'purple' ? styles.pillPurple : tone === 'green' ? styles.pillGreen : styles.pillBlue;
  return <View style={style}><Text style={styles.pillText}>{children}</Text></View>;
}

export function PrimaryButton({ children, onPress, secondary = false, disabled = false }: { children: ReactNode; onPress?: () => void; secondary?: boolean; disabled?: boolean }) {
  const { theme } = useTheme();
  return <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primaryButton, { backgroundColor: secondary ? theme.secondary : theme.primary, borderColor: theme.border }, secondary && styles.secondaryButton, disabled && styles.disabledButton, pressed && { opacity: 0.78 }]}><Text style={[styles.primaryButtonText, secondary && { color: theme.foreground }]}>{children}</Text></Pressable>;
}

const styles = StyleSheet.create({
  backgroundRoot: { flex: 1, overflow: 'hidden' },
  backgroundGradient: StyleSheet.absoluteFill,
  backgroundGlow: { position: 'absolute', top: -140, left: -80, right: -80, height: 330, borderRadius: 220, opacity: 0.7 },
  cardGlow: { position: 'absolute', top: -60, right: -50, width: 160, height: 130, borderRadius: 90, opacity: 0.8 },
  topBar: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingBottom: 15 },
  topTitle: { flex: 1 },
  title: { color: colors.light.foreground, fontFamily: 'Cairo_700Bold', fontSize: 20, fontWeight: '800', textAlign: 'right' },
  subtitle: { color: colors.light.mutedForeground, fontFamily: 'Cairo_400Regular', fontSize: 10, textAlign: 'right', marginTop: 3 },
  iconButton: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border },
  iconButtonGhost: { width: 38 },
  glowCard: { position: 'relative', overflow: 'hidden', padding: 17, borderRadius: 20, borderWidth: 1 },
  sectionLabel: { color: colors.light.mutedForeground, fontSize: 11, fontWeight: '700', textAlign: 'right', marginTop: 22, marginBottom: 9, marginRight: 3 },
  actionRow: { minHeight: 62, flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingHorizontal: 14, borderRadius: 16, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, marginBottom: 9 },
  rowIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.blueSurface },
  dangerIcon: { backgroundColor: colors.light.dangerSurface },
  rowText: { flex: 1 },
  rowTitle: { color: colors.light.foreground, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  rowDescription: { color: colors.light.mutedForeground, fontSize: 10, textAlign: 'right', marginTop: 3 },
  pillBlue: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, backgroundColor: colors.light.primarySoft },
  pillPurple: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, backgroundColor: colors.light.secondarySoft },
  pillGreen: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 5, borderRadius: 12, backgroundColor: '#22c7b433' },
  pillText: { color: '#dcebff', fontSize: 10, fontWeight: '800' },
  primaryButton: { minHeight: 50, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, borderRadius: 14, backgroundColor: colors.light.primary },
  secondaryButton: { backgroundColor: colors.light.secondary, borderWidth: 1, borderColor: colors.light.border },
  disabledButton: { opacity: 0.55 },
  primaryButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  secondaryButtonText: { color: colors.light.foreground },
});

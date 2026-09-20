import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { TopBar } from '@/components/MobileChrome';
import colors from '@/constants/colors';
import { getSecurityEvents, type SecurityEvent } from '@/lib/mobile-api';
import { FeedbackModal } from '@/components/FeedbackModal';

type NotificationItem = {
  id: string;
  title: string;
  text: string;
  time: string;
  icon: keyof typeof Feather.glyphMap;
  read: boolean;
  route?: '/privacy';
};

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ title: string; message: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const events = await getSecurityEvents();
      setItems(events.map((event: SecurityEvent) => ({
        id: `security-${event.id}`,
        title: 'حماية الحساب',
        text: `تم تسجيل الدخول من ${event.deviceName} عبر ${event.browser}.`,
        time: new Date(event.createdAt).toLocaleString('ar-EG'),
        icon: 'shield',
        read: true,
        route: '/privacy',
      })));
    } catch (error) {
      setFeedback({ title: 'تعذر تحميل الإشعارات', message: error instanceof Error ? error.message : 'حاول مرة أخرى.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void load();
  }, [load]));

  const unread = items.filter(item => !item.read).length;

  return (
    <>
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }}>
      <View style={styles.headerRow}><View style={styles.headerCopy}><TopBar title="الإشعارات" subtitle={unread ? `${unread} غير مقروء` : 'كل الإشعارات مقروءة'} /></View><Pressable accessibilityLabel="تحديد الكل كمقروء" disabled={!unread} onPress={() => setItems(current => current.map(item => ({ ...item, read: true })))} style={[styles.markRead, !unread && styles.disabled]}><Feather name="check-circle" size={18} color={colors.light.primary} /></Pressable></View>
      {loading ? <ActivityIndicator color={colors.light.primary} style={styles.loader} /> : items.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="bell-off" size={34} color={colors.light.mutedForeground} />
          <Text style={styles.emptyTitle}>لا توجد إشعارات</Text>
          <Text style={styles.emptyText}>ستظهر هنا تنبيهات تسجيل الدخول وأحداث الحساب.</Text>
        </View>
      ) : <><View style={styles.toolbar}><Text style={styles.toolbarTitle}>كل التنبيهات</Text><Pressable onPress={() => setItems([])}><Text style={styles.clear}>مسح الكل</Text></Pressable></View>{items.map(item => (
        <Pressable key={item.id} onPress={() => item.route && router.push(item.route)} style={[styles.card, !item.read && styles.unread]}>
          <View style={styles.icon}><Feather name={item.icon} size={17} color={colors.light.primary} /></View>
          <View style={styles.text}><Text style={styles.title}>{item.title}</Text><Text style={styles.body}>{item.text}</Text><Text style={styles.time}>{item.time}</Text></View>
          {!item.read && <View style={styles.dot} />}
        </Pressable>
      ))}</>}
    </ScrollView>
    {feedback && <FeedbackModal {...feedback} onClose={() => setFeedback(null)} />}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent', paddingHorizontal: 18 },
  loader: { marginTop: 50 },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 4 },
  headerCopy: { flex: 1 },
  markRead: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border },
  disabled: { opacity: 0.35 },
  toolbar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  toolbarTitle: { color: colors.light.mutedForeground, fontSize: 11, fontWeight: '700' },
  clear: { color: colors.light.destructive, fontSize: 11, fontWeight: '700' },
  card: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 11, padding: 15, borderRadius: 17, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, marginBottom: 9 },
  unread: { borderColor: '#2c5ca7', backgroundColor: '#101f40' },
  icon: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#122850' },
  text: { flex: 1 },
  title: { color: colors.light.foreground, textAlign: 'right', fontSize: 12, fontWeight: '800' },
  body: { color: colors.light.mutedForeground, textAlign: 'right', fontSize: 11, lineHeight: 18, marginTop: 3 },
  time: { color: '#5f739f', textAlign: 'right', fontSize: 9, marginTop: 5 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.light.primary, marginTop: 4 },
  empty: { alignItems: 'center', gap: 8, paddingTop: 100 },
  emptyTitle: { color: colors.light.foreground, fontSize: 15, fontWeight: '800' },
  emptyText: { color: colors.light.mutedForeground, fontSize: 11, textAlign: 'center' },
});
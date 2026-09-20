import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FeedbackModal } from '@/components/FeedbackModal';
import { Feather } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { TopBar } from '@/components/MobileChrome';
import {
  adminBanUser,
  adminGetConversationMessages,
  adminGetConversations,
  adminGetDashboard,
  adminGetInstagramFollowStats,
  adminGetUsers,
  adminGetVerifications,
  adminUnbanUser,
  adminUnverifyUser,
  adminVerifyUser,
  type AdminConversation,
  type AdminConversationMessage,
  type AdminDashboard,
  type AdminUser,
  type AdminVerificationUser,
  type InstagramFollowStats,
} from '@/lib/mobile-api';

type Tab = 'overview' | 'users' | 'verification' | 'conversations';

export default function AdminScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [key, setKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [instagram, setInstagram] = useState<InstagramFollowStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [verifications, setVerifications] = useState<AdminVerificationUser[]>([]);
  const [conversations, setConversations] = useState<AdminConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<{ conversation: AdminConversation; messages: AdminConversationMessage[] } | null>(null);
  const [feedback, setFeedback] = useState<{ title: string; message: string } | null>(null);

  const loadOverview = useCallback(async () => {
    if (!key) return;
    setBusy(true);
    try {
      const [nextDashboard, nextInstagram] = await Promise.all([
        adminGetDashboard(key),
        adminGetInstagramFollowStats(key),
      ]);
      setDashboard(nextDashboard);
      setInstagram(nextInstagram);
      setAuthenticated(true);
    } catch (error) {
      setAuthenticated(false);
      setFeedback({ title: 'تعذر الدخول إلى لوحة الإدارة', message: error instanceof Error ? error.message : 'تحقق من المفتاح.' });
    } finally {
      setBusy(false);
    }
  }, [key]);

  const loadTab = useCallback(async () => {
    if (!authenticated || !key) return;
    setBusy(true);
    try {
      if (tab === 'users') setUsers(await adminGetUsers(key, query));
      if (tab === 'verification') setVerifications(await adminGetVerifications(key, query));
      if (tab === 'conversations') setConversations(await adminGetConversations(key, query));
    } catch (error) {
      setFeedback({ title: 'تعذر تحميل البيانات', message: error instanceof Error ? error.message : 'حاول مرة أخرى.' });
    } finally {
      setBusy(false);
    }
  }, [authenticated, key, query, tab]);

  useFocusEffect(useCallback(() => {
    if (authenticated && tab === 'overview') void loadOverview();
  }, [authenticated, loadOverview, tab]));

  const runUserAction = async (action: () => Promise<unknown>, message: string) => {
    setBusy(true);
    try {
      await action();
      setFeedback({ title: 'تم التنفيذ', message });
      await loadTab();
    } catch (error) {
      setFeedback({ title: 'تعذر تنفيذ الإجراء', message: error instanceof Error ? error.message : 'حاول مرة أخرى.' });
    } finally {
      setBusy(false);
    }
  };

  const openConversation = async (conversation: AdminConversation) => {
    setBusy(true);
    try {
      setSelectedConversation(await adminGetConversationMessages(key, conversation.id));
    } catch (error) {
      setFeedback({ title: 'تعذر تحميل المحادثة', message: error instanceof Error ? error.message : 'حاول مرة أخرى.' });
    } finally {
      setBusy(false);
    }
  };

  if (!authenticated) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
        <TopBar title="لوحة الإدارة" />
        <View style={styles.authCard}>
          <View style={styles.adminIcon}><Feather name="shield" size={26} color="#9fdbff" /></View>
          <Text style={styles.authTitle}>دخول آمن إلى لوحة الإدارة</Text>
          <Text style={styles.authText}>هذه المنطقة لإدارة الحسابات، التوثيق، الاشتراكات والمحتوى. لا يتم حفظ مفتاح الإدارة على الجهاز.</Text>
          <TextInput value={key} onChangeText={setKey} placeholder="مفتاح الإدارة" placeholderTextColor={colors.light.mutedForeground} secureTextEntry autoCapitalize="none" style={styles.input} />
          <Pressable disabled={!key.trim() || busy} onPress={() => void loadOverview()} style={styles.primary}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>دخول</Text>}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <TopBar title="لوحة الإدارة" subtitle="إدارة ERKAN AI من الجوال" right={<Pressable onPress={() => { setAuthenticated(false); setKey(''); }} style={styles.logout}><Feather name="log-out" size={17} color={colors.light.destructive} /></Pressable>} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 28 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {([['overview', 'الملخص'], ['users', 'المستخدمون'], ['verification', 'التوثيق'], ['conversations', 'المحادثات']] as const).map(([value, label]) => (
            <Pressable key={value} onPress={() => setTab(value)} style={[styles.tab, tab === value && styles.tabActive]}><Text style={[styles.tabText, tab === value && styles.tabTextActive]}>{label}</Text></Pressable>
          ))}
        </ScrollView>
        {tab === 'overview' && dashboard && <><View style={styles.statsGrid}><Stat label="المستخدمون" value={dashboard.users} icon="users" /><Stat label="اشتراكات فعالة" value={dashboard.activeSubscriptions} icon="award" /><Stat label="جلسات نشطة" value={dashboard.activeSessions} icon="monitor" /><Stat label="رصيد المحافظ" value={dashboard.walletBalance} icon="credit-card" /></View>{instagram && <View style={styles.card}><Text style={styles.cardTitle}>حملة Instagram</Text><Text style={styles.cardText}>المتابعون: {instagram.followed} · الرافضون: {instagram.declined} · بانتظار الرد: {instagram.pendingUsers}</Text><Text style={styles.cardAccent}>{instagram.followPercent}% نسبة المتابعة</Text></View>}</>}
        {tab !== 'overview' && <View style={styles.searchRow}><TextInput value={query} onChangeText={setQuery} onSubmitEditing={() => void loadTab()} placeholder="بحث بالاسم أو البريد" placeholderTextColor={colors.light.mutedForeground} style={styles.searchInput} /><Pressable onPress={() => void loadTab()} style={styles.searchButton}><Feather name="search" size={17} color="#fff" /></Pressable></View>}
        {busy && <ActivityIndicator color={colors.light.primary} style={styles.loader} />}
        {tab === 'users' && users.map(user => <UserCard key={user.id} user={user} onVerify={() => void runUserAction(() => user.isVerified ? adminUnverifyUser(key, user.id) : adminVerifyUser(key, user.id), user.isVerified ? 'تم إلغاء التوثيق.' : 'تم توثيق الحساب.')} onBan={() => void runUserAction(() => user.accountStatus === 'banned' ? adminUnbanUser(key, user.id) : adminBanUser(key, user.id, 'مخالفة سياسات الاستخدام', null), user.accountStatus === 'banned' ? 'تم فك الحظر.' : 'تم حظر الحساب.')} />)}
        {tab === 'verification' && verifications.map(user => <UserCard key={user.id} user={user} onVerify={() => void runUserAction(() => user.isVerified ? adminUnverifyUser(key, user.id) : adminVerifyUser(key, user.id), user.isVerified ? 'تم إلغاء التوثيق.' : 'تم توثيق الحساب.')} onBan={() => undefined} />)}
        {tab === 'conversations' && conversations.map(conversation => <Pressable key={conversation.id} onPress={() => void openConversation(conversation)} style={styles.card}><Text style={styles.cardTitle}>{conversation.title}</Text><Text style={styles.cardText}>{conversation.userName ?? conversation.email ?? 'مستخدم'} · {conversation.messageCount} رسالة</Text><Text style={styles.cardDate}>{new Date(conversation.updatedAt).toLocaleString('ar-EG')}</Text></Pressable>)}
        {tab !== 'overview' && !busy && ((tab === 'users' && users.length === 0) || (tab === 'verification' && verifications.length === 0) || (tab === 'conversations' && conversations.length === 0)) && <View style={styles.empty}><Feather name="inbox" size={28} color={colors.light.mutedForeground} /><Text style={styles.cardText}>لا توجد نتائج</Text></View>}
      </ScrollView>
      <Modal visible={Boolean(selectedConversation)} transparent animationType="slide" onRequestClose={() => setSelectedConversation(null)}>
        <View style={styles.modalBackdrop}><View style={[styles.modalCard, { paddingBottom: insets.bottom + 18 }]}><View style={styles.modalHeader}><Text style={styles.cardTitle}>{selectedConversation?.conversation.title}</Text><Pressable onPress={() => setSelectedConversation(null)}><Feather name="x" size={21} color={colors.light.mutedForeground} /></Pressable></View><ScrollView>{selectedConversation?.messages.map(message => <View key={message.id} style={[styles.message, message.role === 'user' && styles.userMessage]}><Text style={styles.messageRole}>{message.role === 'user' ? 'المستخدم' : 'ERKAN AI'}</Text><Text style={styles.messageText}>{message.content}</Text></View>)}</ScrollView></View></View>
       </Modal>
       {feedback && <FeedbackModal {...feedback} onClose={() => setFeedback(null)} />}
    </View>
  );
}

function Stat({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: number }) {
  return <View style={styles.stat}><View style={styles.statIcon}><Feather name={icon} size={17} color={colors.light.primary} /></View><Text style={styles.statValue}>{value.toLocaleString('ar-EG')}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

function UserCard({ user, onVerify, onBan }: { user: AdminUser | AdminVerificationUser; onVerify: () => void; onBan: () => void }) {
  return <View style={styles.card}><View style={styles.userTop}><View style={{ flex: 1 }}><Text style={styles.cardTitle}>{user.name} {user.isVerified ? '✓' : ''}</Text><Text style={styles.cardText}>@{user.username} · {user.email}</Text></View><Text style={[styles.status, user.accountStatus === 'banned' && styles.statusBanned]}>{user.accountStatus === 'banned' ? 'محظور' : user.subscriptionType}</Text></View><View style={styles.actions}><Pressable onPress={onVerify} style={styles.actionButton}><Text style={styles.actionText}>{user.isVerified ? 'إلغاء التوثيق' : 'توثيق'}</Text></Pressable>{'accountStatus' in user && <Pressable onPress={onBan} style={[styles.actionButton, styles.dangerButton]}><Text style={styles.dangerText}>{user.accountStatus === 'banned' ? 'فك الحظر' : 'حظر'}</Text></Pressable>}</View></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  authCard: { margin: 18, padding: 22, borderRadius: 22, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, alignItems: 'center' },
  adminIcon: { width: 58, height: 58, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#123b68', marginBottom: 14 },
  authTitle: { color: colors.light.foreground, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  authText: { color: colors.light.mutedForeground, fontSize: 11, lineHeight: 19, textAlign: 'center', marginTop: 9 },
  input: { width: '100%', height: 50, marginTop: 17, borderRadius: 13, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.background, color: colors.light.foreground, paddingHorizontal: 13, textAlign: 'left' },
  primary: { width: '100%', minHeight: 48, marginTop: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.primary },
  primaryText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  logout: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#401b2d' },
  tabs: { flexDirection: 'row-reverse', gap: 8, paddingVertical: 4 },
  tab: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border },
  tabActive: { backgroundColor: '#1c4e93', borderColor: colors.light.primary },
  tabText: { color: colors.light.mutedForeground, fontSize: 11, fontWeight: '700' },
  tabTextActive: { color: '#fff' },
  statsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 9, marginTop: 15 },
  stat: { width: '48%', padding: 14, borderRadius: 16, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, alignItems: 'flex-end' },
  statIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#122850' },
  statValue: { color: colors.light.foreground, fontSize: 21, fontWeight: '900', marginTop: 8 },
  statLabel: { color: colors.light.mutedForeground, fontSize: 10, marginTop: 2 },
  searchRow: { flexDirection: 'row-reverse', gap: 8, marginTop: 14 },
  searchInput: { flex: 1, height: 45, borderRadius: 13, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card, color: colors.light.foreground, paddingHorizontal: 12, textAlign: 'right' },
  searchButton: { width: 45, height: 45, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.primary },
  loader: { marginVertical: 18 },
  card: { padding: 15, borderRadius: 16, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, marginTop: 10 },
  cardTitle: { color: colors.light.foreground, fontSize: 13, fontWeight: '800', textAlign: 'right' },
  cardText: { color: colors.light.mutedForeground, fontSize: 10, lineHeight: 18, textAlign: 'right', marginTop: 4 },
  cardAccent: { color: colors.light.primary, fontSize: 12, fontWeight: '800', textAlign: 'right', marginTop: 9 },
  cardDate: { color: '#6076a7', fontSize: 9, textAlign: 'right', marginTop: 6 },
  userTop: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 10 },
  status: { color: '#79d9b5', fontSize: 9, fontWeight: '800' },
  statusBanned: { color: colors.light.destructive },
  actions: { flexDirection: 'row-reverse', gap: 8, marginTop: 12 },
  actionButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: '#1e4e91' },
  actionText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  dangerButton: { backgroundColor: '#401b2d' },
  dangerText: { color: '#ff9caf', fontSize: 10, fontWeight: '800' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000099' },
  modalCard: { maxHeight: '82%', padding: 18, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.light.background, borderTopWidth: 1, borderColor: colors.light.border },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  message: { padding: 11, borderRadius: 13, backgroundColor: '#11275a', marginBottom: 8 },
  userMessage: { backgroundColor: colors.light.card },
  messageRole: { color: colors.light.primary, fontSize: 9, fontWeight: '800', textAlign: 'right' },
  messageText: { color: colors.light.foreground, fontSize: 11, lineHeight: 18, textAlign: 'right', marginTop: 4 },
});
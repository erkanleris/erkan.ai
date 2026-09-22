import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Modal, Pressable, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';
import { ScreenBackground } from '@/components/MobileChrome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { createConversation, deleteAllConversations, deleteConversation, getConversations, getInstagramFollowPrompt, getMessages, recordInstagramFollowChoice, renameConversation, type Conversation, type InstagramFollowPrompt } from '@/lib/mobile-api';
import { AnimatedErkanLogo } from '@/components/AnimatedErkanLogo';
import { FeedbackModal } from '@/components/FeedbackModal';
import { ConfirmationSheet } from '@/components/ConfirmationSheet';

export default function ChatHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState('');
  const [prompt, setPrompt] = useState('');
  const [renameTarget, setRenameTarget] = useState<Conversation | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameBusy, setRenameBusy] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'tools' | 'chats'>('home');
  const [pinnedIds, setPinnedIds] = useState<number[]>([]);
  const [instagramPrompt, setInstagramPrompt] = useState<InstagramFollowPrompt | null>(null);
  const [instagramBusy, setInstagramBusy] = useState<'follow' | 'decline' | null>(null);
  const [instagramError, setInstagramError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [feedback, setFeedback] = useState<{ title: string; message: string } | null>(null);
  const [menuTarget, setMenuTarget] = useState<Conversation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      setItems(await getConversations());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));
  useEffect(() => {
    AsyncStorage.getItem('erkan-pinned-conversations').then(value => {
      if (!value) return;
      try { setPinnedIds(JSON.parse(value)); } catch { setPinnedIds([]); }
    }).catch(() => {});
  }, []);
  useEffect(() => {
    let active = true;
    setInstagramPrompt(null);
    if (!user?.id) return () => { active = false; };
    getInstagramFollowPrompt().then(next => {
      if (active && next.available) setInstagramPrompt(next);
    }).catch(() => undefined);
    return () => { active = false; };
  }, [user?.id]);

  const openNewChat = async (mode = 'default', initialMessage = '') => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCreating(true);
    try {
      const conversation = await createConversation(mode === 'default' ? 'محادثة جديدة' : mode === 'voice' ? 'محادثة صوتية' : `محادثة ${mode}`, mode);
      setItems(current => [conversation, ...current]);
       router.push({ pathname: '/chat/[id]' as never, params: { id: String(conversation.id), initialMessage, mode } });
    } catch (error) {
      setFeedback({ title: 'تعذر إنشاء المحادثة', message: error instanceof Error ? error.message : 'حاول مرة أخرى.' });
    } finally { setCreating(false); }
  };
  const sendPrompt = () => {
    const initialMessage = prompt.trim();
    if (!initialMessage) return;
    setPrompt('');
    void openNewChat('default', initialMessage);
  };
  const showLockedTool = () => setFeedback({ title: 'ميزة حصرية', message: 'هذه الأداة متاحة في خطة PRO MAX.' });
  const isProMax = user?.subscriptionType === 'pro_max';
  const toolOptions = [
    ['message-circle', 'محادثة ذكية', 'اسأل عن أي شيء', 'default', false],
    ['edit-3', 'كتابة نص', 'اكتب بشكل أفضل', 'write', true],
    ['file-text', 'تلخيص', 'اختصر وقتك', 'summarize', true],
    ['sun', 'أفكار وإلهام', 'ابدأ من الصفر', 'ideas', true],
    ['image', 'صور AI', 'أنشئ صورة', 'image', true],
  ] as const;
  const openTool = (mode: string, locked: boolean) => {
    if (locked && !isProMax) { showLockedTool(); return; }
    void openNewChat(mode);
  };
  const togglePin = async (conversationId: number) => {
    const next = pinnedIds.includes(conversationId)
      ? pinnedIds.filter(id => id !== conversationId)
      : [conversationId, ...pinnedIds];
    setPinnedIds(next);
    await AsyncStorage.setItem('erkan-pinned-conversations', JSON.stringify(next));
  };
  const exportConversation = async (conversation: Conversation) => {
    try {
      const messages = await getMessages(conversation.id);
      const body = messages.map(message => `${message.role === 'user' ? 'أنت' : 'ERKAN AI'}:\n${message.content}`).join('\n\n');
      await Share.share({ title: conversation.title, message: `${conversation.title}\n\n${body}` });
    } catch (error) {
      setFeedback({ title: 'تعذر تصدير المحادثة', message: error instanceof Error ? error.message : 'حاول مرة أخرى.' });
    }
  };
  const manageConversation = (conversation: Conversation) => setMenuTarget(conversation);
  const deleteConversationNow = async () => {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try { await deleteConversation(deleteTarget.id); setItems(current => current.filter(item => item.id !== deleteTarget.id)); setDeleteTarget(null); }
    catch (error) { setFeedback({ title: 'تعذر حذف المحادثة', message: error instanceof Error ? error.message : 'حاول مرة أخرى.' }); }
    finally { setDeleteBusy(false); }
  };
  const clearAll = () => setDeleteAllConfirm(true);
  const clearAllNow = async () => {
    setDeleteBusy(true);
    try { await deleteAllConversations(); setItems([]); setDeleteAllConfirm(false); }
    catch (error) { setFeedback({ title: 'تعذر حذف المحادثات', message: error instanceof Error ? error.message : 'حاول مرة أخرى.' }); }
    finally { setDeleteBusy(false); }
  };
  const chooseInstagram = async (choice: 'follow' | 'decline') => {
    setInstagramBusy(choice);
    setInstagramError('');
    try {
      await recordInstagramFollowChoice(choice);
      setInstagramPrompt(null);
      if (choice === 'follow') await Linking.openURL('https://www.instagram.com/erkan.ai');
    } catch (error) {
      setInstagramError(error instanceof Error ? error.message : 'تعذر حفظ اختيارك');
    } finally {
      setInstagramBusy(null);
    }
  };

const filtered = items.filter(item => item.title.toLowerCase().includes(search.toLowerCase()));
  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ScreenBackground>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Pressable onPress={() => router.push('/profile')} style={styles.headerMenu}><Feather name="menu" size={20} color={colors.light.foreground} /></Pressable>
         <Pressable onPress={() => void openNewChat()} style={styles.headerBrand}><AnimatedErkanLogo size={30} testID="chat-header-logo" /><Text style={styles.headerBrandText}>ERKAN <Text style={styles.headerBrandAccent}>AI</Text></Text></Pressable>
        <View style={styles.headerActions}>
          <Pressable onPress={() => router.push('/notifications')} style={styles.iconButton}><Feather name="bell" size={19} color={colors.light.foreground} /><View style={styles.notificationDot} /></Pressable>
        </View>
      </View>
       <Modal visible={Boolean(renameTarget)} transparent animationType="fade" onRequestClose={() => !renameBusy && setRenameTarget(null)}>
         <View style={styles.modalBackdrop}><View style={styles.renameCard}><Text style={styles.renameTitle}>إعادة تسمية المحادثة</Text><TextInput value={renameValue} onChangeText={setRenameValue} autoFocus placeholder="اسم المحادثة" placeholderTextColor={colors.light.mutedForeground} style={styles.renameInput} /><View style={styles.renameActions}><Pressable disabled={renameBusy} onPress={() => setRenameTarget(null)} style={styles.renameCancel}><Text style={styles.renameCancelText}>إلغاء</Text></Pressable><Pressable disabled={renameBusy || !renameValue.trim()} onPress={async () => { if (!renameTarget) return; setRenameBusy(true); try { const updated = await renameConversation(renameTarget.id, renameValue.trim()); setItems(current => current.map(item => item.id === renameTarget.id ? updated : item)); setRenameTarget(null); } catch (error) { setFeedback({ title: 'تعذر إعادة التسمية', message: error instanceof Error ? error.message : 'حاول مرة أخرى.' }); } finally { setRenameBusy(false); } }} style={styles.renameSave}><Text style={styles.renameSaveText}>{renameBusy ? '...' : 'حفظ'}</Text></Pressable></View></View></View>
       </Modal>
       <Modal visible={Boolean(menuTarget)} transparent animationType="fade" onRequestClose={() => setMenuTarget(null)}>
         <Pressable style={styles.modalBackdrop} onPress={() => setMenuTarget(null)}><Pressable style={styles.menuCard} onPress={event => event.stopPropagation()}>
           <Text style={styles.renameTitle}>{menuTarget?.title}</Text>
           <Pressable style={styles.menuItem} onPress={() => { if (menuTarget) void togglePin(menuTarget.id); setMenuTarget(null); }}><Text style={styles.menuText}>{menuTarget && pinnedIds.includes(menuTarget.id) ? 'إلغاء تثبيت المحادثة' : 'تثبيت المحادثة'}</Text></Pressable>
           <Pressable style={styles.menuItem} onPress={() => { if (menuTarget) void exportConversation(menuTarget); setMenuTarget(null); }}><Text style={styles.menuText}>تصدير المحادثة</Text></Pressable>
           <Pressable style={styles.menuItem} onPress={() => { if (menuTarget) { setRenameTarget(menuTarget); setRenameValue(menuTarget.title); } setMenuTarget(null); }}><Text style={styles.menuText}>إعادة التسمية</Text></Pressable>
           <Pressable style={styles.menuItem} onPress={() => { setDeleteTarget(menuTarget); setMenuTarget(null); }}><Text style={styles.deleteMenuText}>حذف المحادثة</Text></Pressable>
         </Pressable></Pressable>
       </Modal>
       <ConfirmationSheet visible={Boolean(deleteTarget)} title="حذف المحادثة" message="سيتم حذف هذه المحادثة نهائياً." confirmLabel="حذف" destructive busy={deleteBusy} onCancel={() => setDeleteTarget(null)} onConfirm={() => void deleteConversationNow()} />
       <ConfirmationSheet visible={deleteAllConfirm} title="حذف كل المحادثات" message="سيتم حذف جميع محادثاتك نهائياً." confirmLabel="حذف الكل" destructive busy={deleteBusy} onCancel={() => setDeleteAllConfirm(false)} onConfirm={() => void clearAllNow()} />
       {feedback && <FeedbackModal {...feedback} action={feedback.title === 'ميزة حصرية' ? () => router.push('/plans') : undefined} actionLabel="عرض الخطط" onClose={() => setFeedback(null)} />}
      <Modal visible={Boolean(instagramPrompt)} transparent animationType="fade" onRequestClose={() => undefined}>
        <View style={styles.igBackdrop}>
          <View style={styles.igCard}>
            <View style={styles.igIcon}><Feather name="instagram" size={28} color="#fff" /></View>
            <View style={styles.igBadge}><Feather name="gift" size={14} color="#ffd98a" /><Text style={styles.igBadgeText}>هدية ترحيبية</Text></View>
            <Text style={styles.igTitle}>تابع ERKAN AI على Instagram</Text>
            <Text style={styles.igBody}>تابع الحساب الرسمي ليصلك جديد التطبيق وتشارك في الحملات والهدايا القادمة.</Text>
            <View style={styles.igBenefit}><Feather name="users" size={16} color="#9fdbff" /><Text style={styles.igBenefitText}>كن جزءاً من مجتمع ERKAN AI</Text></View>
            <View style={styles.igBenefit}><Feather name="gift" size={16} color="#ffd98a" /><Text style={styles.igBenefitText}>فرص وهدايا خاصة للمتابعين</Text></View>
            {instagramError ? <Text style={styles.igError}>{instagramError}</Text> : null}
            <Pressable disabled={Boolean(instagramBusy)} onPress={() => void chooseInstagram('follow')} style={styles.igPrimary}>
              {instagramBusy === 'follow' ? <ActivityIndicator color="#fff" /> : <><Feather name="instagram" size={17} color="#fff" /><Text style={styles.igPrimaryText}>متابعة الحساب الرسمي</Text></>}
            </Pressable>
            <Pressable disabled={Boolean(instagramBusy)} onPress={() => void chooseInstagram('decline')} style={styles.igSecondary}>
              <Text style={styles.igSecondaryText}>{instagramBusy === 'decline' ? 'جار الحفظ...' : 'ليس الآن'}</Text>
            </Pressable>
            <Text style={styles.igNote}>@erkan.ai</Text>
          </View>
        </View>
      </Modal>
         <View style={styles.content}>
         {activeTab === 'home' && <>
        <Animated.View entering={FadeInDown.delay(40).duration(500)} style={styles.greetingBlock}>
          <View style={styles.sparkle}><Feather name="star" size={15} color="#d9ccff" /></View>
          <Text style={styles.greeting}>أهلاً، {user?.name || 'بك'}</Text>
          <Text style={styles.subtitle}>ماذا تريد أن تنجز اليوم؟</Text>
          <Text style={styles.tagline}>ذكاء عربي بلا حدود</Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(80).duration(500)} style={styles.promptCard}>
          <TextInput value={prompt} onChangeText={setPrompt} onSubmitEditing={sendPrompt} placeholder="اسأل ERKAN عن أي شيء..." placeholderTextColor={colors.light.mutedForeground} style={styles.promptInput} returnKeyType="send" />
          <Pressable onPress={() => void openNewChat('voice')} style={styles.promptAction}><Feather name="mic" size={17} color={colors.light.primary} /></Pressable>
          <Pressable onPress={sendPrompt} style={[styles.promptSend, !prompt.trim() && styles.promptSendDisabled]}><Feather name="arrow-up" size={18} color="#fff" /></Pressable>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(180).duration(500)} style={styles.proCard}>
          <View style={styles.proIcon}><Feather name="zap" size={18} color="#d7c6ff" /></View>
          <View style={{ flex: 1 }}><Text style={styles.proTitle}>اكتشف قوة PRO</Text><Text style={styles.proHint}>رسائل أكثر وأدوات متقدمة وتجربة أسرع</Text></View>
          <Pressable onPress={() => router.push('/plans')} style={styles.proButton}><Text style={styles.proButtonText}>ترقية</Text></Pressable>
        </Animated.View>
         <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>أدوات ERKAN</Text><Text style={styles.count}>استكشف</Text></View>
          <View style={styles.toolsGrid}>{toolOptions.map(([icon, label, description, mode, locked]) => <Pressable key={label} onPress={() => openTool(mode, locked)} style={({ pressed }) => [styles.tool, locked && !isProMax && styles.lockedTool, pressed && { opacity: 0.72 }]}><View style={styles.toolIcon}><Feather name={icon as keyof typeof Feather.glyphMap} size={17} color={locked && !isProMax ? '#9a82d5' : colors.light.primary} /></View><Text style={styles.toolText}>{label}</Text><Text style={styles.toolDescription}>{description}</Text>{locked && !isProMax && <View style={styles.lockBadge}><Feather name="lock" size={9} color="#fff" /></View>}</Pressable>)}</View>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>أحدث محادثاتك</Text><Pressable onPress={() => setActiveTab('chats')}><Text style={styles.count}>عرض الكل</Text></Pressable></View>
           {loading ? <ActivityIndicator color={colors.light.primary} style={{ marginVertical: 26 }} /> : loadError ? <View style={styles.homeState}><Feather name="alert-triangle" size={24} color={colors.light.destructive} /><Text style={styles.emptyTitle}>تعذر تحميل المحادثات</Text><Text style={styles.emptyText}>{loadError}</Text><Pressable onPress={() => void load()} style={styles.retryButton}><Text style={styles.retryText}>إعادة المحاولة</Text></Pressable></View> : items.length === 0 ? <View style={styles.homeState}><Feather name="message-circle" size={28} color={colors.light.mutedForeground} /><Text style={styles.emptyTitle}>لا توجد محادثات بعد</Text><Text style={styles.emptyText}>ابدأ محادثتك الأولى مع مساعدك العربي</Text></View> : items.slice(0, 5).map(item => <View key={item.id} style={styles.conversation}><Pressable onPress={() => router.push({ pathname: '/chat/[id]' as never, params: { id: String(item.id), mode: item.mode } })} style={({ pressed }) => [styles.conversationMain, pressed && { opacity: 0.75 }]}><View style={styles.conversationIcon}><Feather name={pinnedIds.includes(item.id) ? 'bookmark' : 'message-square'} size={17} color={colors.light.primary} /></View><View style={{ flex: 1 }}><Text style={styles.conversationTitle} numberOfLines={1}>{item.title}</Text><Text style={styles.conversationTime}>{new Date(item.updatedAt).toLocaleDateString('ar')}</Text></View><Feather name="chevron-left" size={17} color={colors.light.mutedForeground} /></Pressable><Pressable onPress={() => manageConversation(item)} accessibilityLabel={`خيارات ${item.title}`} style={styles.conversationAction}><Feather name="more-horizontal" size={18} color={colors.light.mutedForeground} /></Pressable></View>)}
         </>}
         {activeTab === 'tools' && <View>
           <View style={styles.tabHeading}><Feather name="grid" size={18} color={colors.light.primary} /><Text style={styles.sectionTitle}>كل الأدوات</Text></View>
           <View style={styles.toolsGridFull}>{toolOptions.map(([icon, label, description, mode, locked]) => <Pressable key={label} onPress={() => openTool(mode, locked)} style={({ pressed }) => [styles.toolLarge, locked && !isProMax && styles.lockedTool, pressed && { opacity: 0.72 }]}><View style={styles.toolIcon}><Feather name={icon as keyof typeof Feather.glyphMap} size={20} color={locked && !isProMax ? '#9a82d5' : colors.light.primary} /></View><Text style={styles.toolText}>{label}</Text><Text style={styles.toolDescription}>{description}</Text>{locked && !isProMax && <View style={styles.lockBadge}><Feather name="lock" size={9} color="#fff" /></View>}</Pressable>)}</View>
         </View>}
         {activeTab === 'chats' && <View>
         <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>محادثاتك</Text><Pressable onPress={() => void load()}><Feather name="refresh-cw" size={16} color={colors.light.primary} /></Pressable></View>
        <View style={styles.searchBox}><Feather name="search" size={16} color={colors.light.mutedForeground} /><TextInput value={search} onChangeText={setSearch} placeholder="ابحث في المحادثات" placeholderTextColor={colors.light.mutedForeground} style={styles.searchInput} /></View>
          {loading ? <ActivityIndicator color={colors.light.primary} style={{ marginTop: 40 }} /> : loadError ? <View style={styles.empty}><Feather name="alert-triangle" size={31} color={colors.light.destructive} /><Text style={styles.emptyTitle}>تعذر تحميل المحادثات</Text><Pressable onPress={() => void load()} style={styles.retryButton}><Text style={styles.retryText}>إعادة المحاولة</Text></Pressable></View> : <FlatList data={[...filtered].sort((a, b) => Number(pinnedIds.includes(b.id)) - Number(pinnedIds.includes(a.id)) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())} keyExtractor={item => String(item.id)} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled" ListEmptyComponent={<View style={styles.empty}><Feather name="message-circle" size={31} color={colors.light.mutedForeground} /><Text style={styles.emptyTitle}>لا توجد محادثات بعد</Text><Text style={styles.emptyText}>ابدأ محادثتك الأولى مع مساعدك العربي</Text></View>} renderItem={({ item }) => <View style={styles.conversation}><Pressable onLongPress={() => manageConversation(item)} onPress={() => router.push({ pathname: '/chat/[id]' as never, params: { id: String(item.id), mode: item.mode } })} style={({ pressed }) => [styles.conversationMain, pressed && { opacity: 0.75 }]}><View style={styles.conversationIcon}><Feather name={pinnedIds.includes(item.id) ? 'bookmark' : 'message-square'} size={17} color={colors.light.primary} /></View><View style={{ flex: 1 }}><Text style={styles.conversationTitle} numberOfLines={1}>{item.title}</Text><Text style={styles.conversationTime}>{new Date(item.updatedAt).toLocaleDateString('ar')}</Text></View></Pressable><Pressable onPress={() => manageConversation(item)} accessibilityLabel={`خيارات ${item.title}`} style={styles.conversationAction}><Feather name="more-horizontal" size={18} color={colors.light.mutedForeground} /></Pressable></View>} />}
         </View>}
      </View>
       <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
         <Pressable style={[styles.navItem, activeTab === 'home' && styles.navItemActive]} onPress={() => setActiveTab('home')}><Feather name="home" size={18} color={activeTab === 'home' ? colors.light.primary : colors.light.mutedForeground} /><Text style={[styles.navText, activeTab === 'home' && styles.navTextActive]}>الرئيسية</Text></Pressable>
         <Pressable style={[styles.navItem, activeTab === 'tools' && styles.navItemActive]} onPress={() => isProMax ? setActiveTab('tools') : showLockedTool()}><Feather name="grid" size={18} color={activeTab === 'tools' ? colors.light.primary : colors.light.mutedForeground} /><Text style={[styles.navText, activeTab === 'tools' && styles.navTextActive]}>الأدوات</Text>{!isProMax && <Feather name="lock" size={9} color={colors.light.mutedForeground} style={styles.navLock} />}</Pressable>
        <Pressable testID="center-chat-logo" accessibilityLabel="فتح دردشة جديدة" style={styles.navNew} onPress={() => void openNewChat()}><AnimatedErkanLogo size={48} variant="circular" testID="center-animated-logo" /></Pressable>
         <Pressable style={[styles.navItem, activeTab === 'chats' && styles.navItemActive]} onPress={() => setActiveTab('chats')}><Feather name="message-circle" size={18} color={activeTab === 'chats' ? colors.light.primary : colors.light.mutedForeground} /><Text style={[styles.navText, activeTab === 'chats' && styles.navTextActive]}>محادثاتي</Text></Pressable>
         <Pressable style={styles.navItem} onPress={() => router.push('/profile')}><Feather name="user" size={18} color={colors.light.mutedForeground} /><Text style={styles.navText}>الملف</Text></Pressable>
       </View>
      </ScreenBackground>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.light.background },
  header: { paddingHorizontal: 20, paddingBottom: 19, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ffffff12', backgroundColor: '#02081799' },
  headerMenu: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  headerBrandMark: { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#173b83', borderWidth: 1, borderColor: '#36b9ff' },
  headerBrandLetter: { color: '#9fe7ff', fontSize: 16, fontWeight: '900' },
  headerBrandText: { color: colors.light.foreground, fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  headerBrandAccent: { color: '#a881ff' },
  greeting: { color: colors.light.foreground, fontSize: 20, fontWeight: '800', textAlign: 'right' },
  subtitle: { color: colors.light.mutedForeground, fontSize: 12, textAlign: 'right', marginTop: 3 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  iconButton: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border },
  miniMark: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#182c64', borderWidth: 1, borderColor: '#2e75d4' },
  miniMarkText: { color: '#63cfff', fontWeight: '900', fontSize: 19 },
  notificationDot: { position: 'absolute', right: 8, top: 7, width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff7691' },
  content: { flex: 1, paddingHorizontal: 18, paddingTop: 20 },
  greetingBlock: { alignItems: 'center', marginBottom: 15 },
  sparkle: { width: 31, height: 31, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#4b3292', marginBottom: 8 },
  tagline: { color: '#a881ff', fontSize: 10, marginTop: 6, fontWeight: '700' },
  promptCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, padding: 7, borderRadius: 16, backgroundColor: colors.light.surfaceOverlay, borderWidth: 1, borderColor: '#1f8bff55', marginBottom: 17 },
  promptInput: { flex: 1, minHeight: 41, color: colors.light.foreground, textAlign: 'right', fontSize: 12, paddingHorizontal: 8 },
  promptAction: { width: 37, height: 37, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.primarySoft },
  promptSend: { width: 39, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.primary },
  promptSendDisabled: { opacity: 0.45 },
  newCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 13, padding: 16, borderRadius: 20, backgroundColor: '#11275a', borderWidth: 1, borderColor: '#2652a0' },
  newIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.primary },
  newTitle: { color: '#fff', textAlign: 'right', fontSize: 14, fontWeight: '800' },
  newHint: { color: '#91b5ef', textAlign: 'right', fontSize: 11, marginTop: 3 },
  proCard: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, padding: 13, marginTop: 12, borderRadius: 18, backgroundColor: colors.light.secondarySoft, borderWidth: 1, borderColor: '#a855f755' },
  proIcon: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#a855f733' },
  proTitle: { color: '#fff', textAlign: 'right', fontSize: 12, fontWeight: '800' },
  proHint: { color: '#c4b8e9', textAlign: 'right', fontSize: 9, marginTop: 3 },
  proButton: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.light.secondary },
  proButtonText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  toolsGrid: { flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 6 },
  tool: { width: '19%', minHeight: 85, alignItems: 'center', gap: 5, paddingVertical: 9, borderRadius: 14, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border },
  lockedTool: { opacity: 0.7, borderColor: '#503b82' },
  toolIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.primarySoft },
  toolText: { color: colors.light.mutedForeground, fontSize: 10, fontWeight: '700' },
  toolDescription: { color: '#5f739f', fontSize: 7, textAlign: 'center' },
  lockBadge: { position: 'absolute', top: 5, right: 5, width: 15, height: 15, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#6943bd' },
  sectionHeader: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 26, marginBottom: 10 },
  sectionActions: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  clearAll: { color: colors.light.destructive, fontSize: 10, fontWeight: '700' },
  modalBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#00000099' },
  renameCard: { width: '100%', padding: 20, borderRadius: 22, backgroundColor: colors.light.background, borderWidth: 1, borderColor: colors.light.border },
  renameTitle: { color: colors.light.foreground, textAlign: 'right', fontSize: 16, fontWeight: '800', marginBottom: 12 },
  renameInput: { height: 48, borderRadius: 13, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card, color: colors.light.foreground, textAlign: 'right', paddingHorizontal: 12 },
  renameActions: { flexDirection: 'row-reverse', gap: 9, marginTop: 14 },
  renameCancel: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: colors.light.card },
  renameCancelText: { color: colors.light.mutedForeground, fontWeight: '700', fontSize: 12 },
  renameSave: { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, backgroundColor: colors.light.primary },
  renameSaveText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  menuCard: { width: '100%', padding: 20, borderRadius: 22, backgroundColor: colors.light.background, borderWidth: 1, borderColor: colors.light.border },
  menuItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.light.border },
  menuText: { color: colors.light.foreground, textAlign: 'right', fontSize: 13, fontWeight: '700' },
  deleteMenuText: { color: colors.light.destructive, textAlign: 'right', fontSize: 13, fontWeight: '800' },
  igBackdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 22, backgroundColor: '#020817cc' },
  igCard: { width: '100%', maxWidth: 380, padding: 22, borderRadius: 25, backgroundColor: '#101b3b', borderWidth: 1, borderColor: '#34518e', alignItems: 'center' },
  igIcon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#8b3d98', marginBottom: 12 },
  igBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#4b3c2a' },
  igBadgeText: { color: '#ffd98a', fontSize: 10, fontWeight: '800' },
  igTitle: { color: '#fff', fontSize: 19, fontWeight: '900', textAlign: 'center', marginTop: 14 },
  igBody: { color: '#b7c8e8', fontSize: 12, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  igBenefit: { width: '100%', flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 12 },
  igBenefitText: { color: '#d7e6ff', fontSize: 11, textAlign: 'right' },
  igError: { color: '#ff9caf', fontSize: 11, textAlign: 'center', marginTop: 10 },
  igPrimary: { width: '100%', minHeight: 48, borderRadius: 14, marginTop: 18, backgroundColor: '#8b3d98', alignItems: 'center', justifyContent: 'center', flexDirection: 'row-reverse', gap: 8 },
  igPrimaryText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  igSecondary: { padding: 12 },
  igSecondaryText: { color: '#a9bddf', fontSize: 12, fontWeight: '700' },
  igNote: { color: '#6f87b7', fontSize: 10, marginTop: 2 },
  sectionTitle: { color: colors.light.foreground, fontSize: 16, fontWeight: '800' },
  count: { color: colors.light.primary, fontSize: 12, fontWeight: '700' },
  searchBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, borderRadius: 13, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, paddingHorizontal: 12, marginBottom: 12 },
  searchInput: { flex: 1, height: 42, color: colors.light.foreground, textAlign: 'right', fontSize: 12 },
  conversation: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, padding: 8, borderRadius: 16, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, marginBottom: 9 },
  conversationMain: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', gap: 11, padding: 6 },
  conversationAction: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.primarySoft },
  conversationIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#122850' },
  conversationTitle: { color: colors.light.foreground, textAlign: 'right', fontSize: 13, fontWeight: '700' },
  conversationTime: { color: colors.light.mutedForeground, textAlign: 'right', fontSize: 10, marginTop: 3 },
  empty: { alignItems: 'center', paddingTop: 55, gap: 8 },
  emptyTitle: { color: colors.light.foreground, fontSize: 14, fontWeight: '800' },
  emptyText: { color: colors.light.mutedForeground, fontSize: 11 },
  homeState: { alignItems: 'center', paddingVertical: 24, gap: 7 },
  retryButton: { marginTop: 4, paddingHorizontal: 16, paddingVertical: 9, borderRadius: 11, backgroundColor: colors.light.primary },
  retryText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  bottomNav: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-around', paddingTop: 9, borderTopWidth: 1, borderTopColor: colors.light.border, backgroundColor: colors.light.background },
  navItem: { alignItems: 'center', gap: 3, minWidth: 48 },
  navItemActive: { opacity: 1 },
  navText: { color: colors.light.mutedForeground, fontSize: 9 },
  navTextActive: { color: colors.light.primary, fontWeight: '800' },
  navLock: { position: 'absolute', top: -2, right: 2 },
  navNew: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: '#122b68', marginTop: -24, borderWidth: 3, borderColor: colors.light.background, shadowColor: '#3bbcff', shadowOpacity: 0.75, shadowRadius: 14, elevation: 8 },
  navLogo: { width: 47, height: 47, borderRadius: 24 },
  navLogoRing: { position: 'absolute', inset: -3, borderRadius: 32, borderWidth: 1, borderColor: '#36b9ff', opacity: 0.85 },
  tabHeading: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, marginTop: 8, marginBottom: 18 },
  toolsGridFull: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10 },
  toolLarge: { width: '31%', minHeight: 110, alignItems: 'center', gap: 6, paddingVertical: 13, borderRadius: 16, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border },
});
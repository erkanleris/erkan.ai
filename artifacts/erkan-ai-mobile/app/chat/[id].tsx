import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import colors from '@/constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { generateImage, getMessages, streamMessage } from '@/lib/mobile-api';
import { AnimatedErkanLogo } from '@/components/AnimatedErkanLogo';
import { FeedbackModal } from '@/components/FeedbackModal';

type LocalMessage = { id: number; role: 'user' | 'assistant'; content: string; createdAt: string; localId: string; conversationId?: number; imageUrl?: string };
let localCounter = 0;
const nextLocalId = () => `mobile-message-${Date.now()}-${localCounter++}`;

export default function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id, initialMessage, mode } = useLocalSearchParams<{ id: string; initialMessage?: string; mode?: string }>();
  const { user } = useAuth();
  const conversationId = Number(id);
  const currentMode = Array.isArray(mode) ? mode[0] : mode ?? 'default';
  const inputRef = useRef<TextInput>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachOpen, setAttachOpen] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [disliked, setDisliked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const [toolUsage, setToolUsage] = useState(0);
  const [feedback, setFeedback] = useState<{ title: string; message: string; action?: () => void; actionLabel?: string } | null>(null);
  const initialMessageSent = useRef(false);
  const plan = user?.subscriptionType === 'pro_max' ? 'pro_max' : user?.subscriptionType === 'pro' ? 'pro' : 'free';
  const toolLimit = plan === 'free' ? 3 : plan === 'pro' ? 10 : 50;
  const toolUsageKey = `erkan-tool-usage:${user?.id ?? 'guest'}`;

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const saved = await getMessages(conversationId);
      setMessages(saved.map(message => ({
        ...message,
        localId: `server-message-${message.id}`,
        conversationId,
      })));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر تحميل المحادثة');
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => { if (Number.isFinite(conversationId)) void loadMessages(); }, [conversationId, loadMessages]);
  useEffect(() => {
    AsyncStorage.getItem(toolUsageKey).then(value => {
      try {
        const saved = value ? JSON.parse(value) as { day?: string; count?: number } : null;
        const today = new Date().toISOString().slice(0, 10);
        setToolUsage(saved?.day === today ? Math.max(0, Number(saved.count) || 0) : 0);
      } catch { setToolUsage(0); }
    }).catch(() => {});
  }, [toolUsageKey]);

  const consumeToolUse = async () => {
    if (toolUsage >= toolLimit) {
      setFeedback({ title: 'تم بلوغ الحد اليومي', message: `يمكنك استخدام ${toolLimit} أدوات يومياً في خطتك الحالية.`, action: () => router.push('/plans'), actionLabel: 'عرض الخطط' });
      return false;
    }
    const next = toolUsage + 1;
    setToolUsage(next);
    await AsyncStorage.setItem(toolUsageKey, JSON.stringify({ day: new Date().toISOString().slice(0, 10), count: next }));
    return true;
  };

  const sendContent = async (content: string) => {
    if (!content || streaming) return;
    setError(null);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setText('');
    const userMessage: LocalMessage = { id: -Date.now(), conversationId, role: 'user', content, createdAt: new Date().toISOString(), localId: nextLocalId() };
    setMessages(current => [...current, userMessage]);
    setStreaming(true);
    let assistantId = '';
    try {
       if (currentMode === 'image' || /^توليد صورة\s*:/i.test(content)) {
        if (plan !== 'pro_max') {
           setFeedback({ title: 'ميزة حصرية', message: 'توليد الصور متاح في خطة PRO MAX.', action: () => router.push('/plans'), actionLabel: 'عرض الخطط' });
          setStreaming(false);
          return;
        }
        const prompt = content.replace(/^توليد صورة\s*:/i, '').trim();
        if (!prompt) throw new Error('اكتب وصف الصورة أولاً.');
        const result = await generateImage(prompt);
        setMessages(current => [...current, { id: -Date.now(), conversationId, role: 'assistant', content: 'تم إنشاء الصورة من طلبك.', imageUrl: result.url, createdAt: new Date().toISOString(), localId: nextLocalId() }]);
        return;
      }
       await streamMessage(conversationId, content, chunk => {
        if (!assistantId) {
          assistantId = nextLocalId();
          setMessages(current => [...current, { id: -Date.now(), conversationId, role: 'assistant', content: chunk, createdAt: new Date().toISOString(), localId: assistantId }]);
        } else {
          setMessages(current => current.map(message => message.localId === assistantId ? { ...message, content: message.content + chunk } : message));
        }
       }, currentMode);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'تعذر إكمال الرد');
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  };
  const send = async () => {
    const content = text.trim();
    setText('');
    await sendContent(content);
  };

  const handleAttachment = async (label: string) => {
    setAttachOpen(false);
    if (label === 'كاميرا' || label === 'المعرض') {
      const result = label === 'كاميرا'
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
      if (!result.canceled && result.assets[0]) {
        if (!(await consumeToolUse())) return;
        setText(`حلل الصورة المرفقة: ${result.assets[0].uri}`);
        inputRef.current?.focus();
      }
      return;
    }
    if (label === 'توليد صورة' && plan !== 'pro_max') {
      setFeedback({ title: 'ميزة حصرية', message: 'توليد الصور متاح في خطة PRO MAX.', action: () => router.push('/plans'), actionLabel: 'عرض الخطط' });
      return;
    }
    if (!(await consumeToolUse())) return;
    const prompts: Record<string, string> = {
      مستند: 'سأرفق مستنداً لتحليله',
      PDF: 'حلل ملف PDF المرفق',
      كود: 'راجع الكود التالي وحسّنه',
      حاسبة: 'احسب لي: ',
      موعد: 'ساعدني في تنظيم موعد',
      موقع: 'ما المعلومات المهمة عن هذا الموقع؟',
       QR: 'اقرأ رمز QR المرفق',
       صوت: 'حلل الملف الصوتي المرفق',
       فيديو: 'حلل الفيديو المرفق',
       OCR: 'استخرج النص من الصورة المرفقة',
       'تحليل ملف': 'حلل الملف المرفق بالتفصيل',
       ملاحظات: 'نظّم هذه الملاحظات',
       جهات: 'ساعدني في تنظيم جهات الاتصال',
       ويب: 'ابحث في الويب عن: ',
       جداول: 'أنشئ جدولاً منظماً للبيانات التالية: ',
       رسوم: 'أنشئ رسماً بيانياً للبيانات التالية: ',
       رسم: 'ساعدني في رسم مخطط: ',
    };
    setText(prompts[label] ?? `استخدم أداة ${label}`);
    inputRef.current?.focus();
  };

  useEffect(() => {
    const content = Array.isArray(initialMessage) ? initialMessage[0] : initialMessage;
    if (!loading && messages.length === 0 && content?.trim() && !initialMessageSent.current) {
      initialMessageSent.current = true;
      setText(content);
      void sendContent(content);
    }
  }, [initialMessage, loading, messages.length, sendContent]);

  const renderMessage = ({ item }: { item: LocalMessage }) => (
    <Animated.View entering={FadeInUp.duration(260)} style={[styles.messageGroup, item.role === 'user' ? styles.userGroup : styles.assistantGroup]}>
         <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}><Text selectable style={styles.bubbleText}>{item.content}</Text>{item.imageUrl && <Image source={{ uri: item.imageUrl }} style={styles.generatedImage} resizeMode="contain" />}</View>
       {item.role === 'assistant' && <View style={styles.messageActions}>
         <Pressable onPress={() => { void Share.share({ message: item.content }); setCopied(item.localId); setTimeout(() => setCopied(null), 1800); }}><Feather name={copied === item.localId ? 'check' : 'copy'} size={14} color={copied === item.localId ? '#55dfb0' : colors.light.mutedForeground} /></Pressable>
        <Pressable onPress={() => void Share.share({ message: item.content })}><Feather name="share-2" size={14} color={colors.light.mutedForeground} /></Pressable>
         <Pressable onPress={() => { const index = messages.findIndex(message => message.localId === item.localId); const previous = index > 0 ? messages[index - 1] : null; if (previous?.role === 'user') void sendContent(previous.content); }}><Feather name="refresh-cw" size={14} color={colors.light.mutedForeground} /></Pressable>
        <View style={styles.actionDivider} />
         <Pressable onPress={() => { setLiked(current => { const next = new Set(current); if (next.has(item.localId)) next.delete(item.localId); else next.add(item.localId); return next; }); setDisliked(current => { const next = new Set(current); next.delete(item.localId); return next; }); }}><Feather name="thumbs-up" size={14} color={liked.has(item.localId) ? '#55a8ff' : colors.light.mutedForeground} /></Pressable>
         <Pressable onPress={() => { setDisliked(current => { const next = new Set(current); if (next.has(item.localId)) next.delete(item.localId); else next.add(item.localId); return next; }); setLiked(current => { const next = new Set(current); next.delete(item.localId); return next; }); }}><Feather name="thumbs-down" size={14} color={disliked.has(item.localId) ? '#ff8292' : colors.light.mutedForeground} /></Pressable>
      </View>}
    </Animated.View>
  );

  const reversed = [...messages].reverse();
  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
       <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}><Feather name="arrow-right" size={20} color={colors.light.foreground} /></Pressable>
         <View style={styles.headerTitle}><AnimatedErkanLogo size={30} testID="conversation-header-logo" /><View><Text style={styles.title}>ERKAN AI</Text><Text style={styles.online}>مساعدك العربي</Text></View></View>
        <Pressable onPress={() => router.push('/settings')} style={styles.headerButton}><Feather name="more-horizontal" size={20} color={colors.light.foreground} /></Pressable>
      </View>

      {loading ? <View style={styles.center}><ActivityIndicator color={colors.light.primary} /></View> : (
        <>
           <FlatList
            data={reversed}
            inverted={messages.length > 0}
            keyExtractor={item => item.localId}
            contentContainerStyle={[styles.list, messages.length === 0 && styles.emptyList]}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={streaming ? <View style={styles.typing}><View style={styles.typingDot} /><View style={styles.typingDot} /><View style={styles.typingDot} /><Text style={styles.typingText}>ERKAN يكتب...</Text></View> : null}
            ListEmptyComponent={<View style={styles.empty}><Feather name="message-circle" size={38} color={colors.light.primary} /><Text style={styles.emptyTitle}>كيف أساعدك اليوم؟</Text><Text style={styles.emptyText}>اكتب سؤالك بالعربية وسأحاول مساعدتك</Text></View>}
            renderItem={renderMessage}
          />
          {messages.length === 0 && !loading && (
            <View style={styles.suggestions}>
              {['اكتب لي خطة يومية', 'لخّص هذا النص', 'ساعدني في فكرة مشروع', 'ترجم هذا النص إلى الإنجليزية'].map(suggestion => (
                <Pressable key={suggestion} onPress={() => { setText(suggestion); inputRef.current?.focus(); }} style={({ pressed }) => [styles.suggestion, pressed && { opacity: 0.72 }]}>
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
       {!loading && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolBar}>
         {['ترجمة', 'تحليل', 'صورة', 'محادثة جديدة'].map((label, index) => <Pressable key={label} onPress={() => index === 3 ? router.replace('/chat') : index === 2 ? setText('توليد صورة: ') : void sendContent(index === 0 ? 'ترجم آخر رد إلى الإنجليزية' : 'حلل آخر رد بالتفصيل')} style={styles.toolChip}><Feather name={index === 0 ? 'globe' : index === 1 ? 'search' : index === 2 ? 'image' : 'plus'} size={13} color={colors.light.primary} /><Text style={styles.toolChipText}>{label}</Text></Pressable>)}
      </ScrollView>}
      <View style={[styles.composerArea, { paddingBottom: Math.max(insets.bottom, 12) }]}>
         {attachOpen && <View style={styles.attachmentMenu}><Text style={styles.attachmentUsage}>استخدام الأدوات اليوم: {toolUsage}/{toolLimit}</Text>{[['camera', 'كاميرا'], ['image', 'المعرض'], ['file-text', 'مستند'], ['file', 'PDF'], ['music', 'صوت'], ['video', 'فيديو'], ['sparkles', 'توليد صورة'], ['scan', 'تحليل صورة'], ['file-search', 'تحليل ملف'], ['scan-text', 'OCR'], ['grid', 'QR'], ['globe', 'ترجمة'], ['code', 'كود'], ['edit-3', 'ملاحظات'], ['calculator', 'حاسبة'], ['calendar', 'موعد'], ['users', 'جهات'], ['map-pin', 'موقع'], ['search', 'ويب'], ['table', 'جداول'], ['pie-chart', 'رسوم'], ['edit-2', 'رسم']].map(([icon, label]) => <Pressable key={label} onPress={() => void handleAttachment(label)} style={styles.attachmentItem}><View style={styles.attachmentIcon}><Feather name={icon as keyof typeof Feather.glyphMap} size={16} color={colors.light.primary} /></View><Text style={styles.attachmentText}>{label}</Text></Pressable>)}</View>}
        <View style={styles.composer}>
          <Pressable onPress={() => setAttachOpen(value => !value)} style={[styles.attachButton, attachOpen && styles.attachButtonOpen]}><Feather name={attachOpen ? 'x' : 'plus'} size={20} color="#fff" /></Pressable>
           <TextInput ref={inputRef} value={text} onChangeText={setText} placeholder={currentMode === 'image' ? 'اكتب وصف الصورة...' : 'اكتب رسالتك...'} placeholderTextColor={colors.light.mutedForeground} multiline blurOnSubmit={false} style={styles.input} />
          <Pressable testID="send-message" onPress={send} disabled={!text.trim() || streaming} style={({ pressed }) => [styles.send, (!text.trim() || streaming) && styles.sendDisabled, pressed && { opacity: 0.75 }]}><Feather name="arrow-up" size={19} color="#fff" /></Pressable>
        </View>
        <Text style={styles.disclaimer}>قد تحتوي إجابات الذكاء الاصطناعي على أخطاء، راجع المعلومات المهمة.</Text>
      </View>
       {feedback && <FeedbackModal {...feedback} onClose={() => setFeedback(null)} />}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.light.border },
  headerButton: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border },
  headerTitle: { flexDirection: 'row-reverse', alignItems: 'center', gap: 9 },
  statusDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: colors.light.success },
  title: { color: colors.light.foreground, fontSize: 15, fontWeight: '800', textAlign: 'right' },
  online: { color: colors.light.mutedForeground, fontSize: 10, textAlign: 'right', marginTop: 2 },
  list: { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 12 },
  emptyList: { flex: 1, justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 8, paddingHorizontal: 25 },
  emptyTitle: { color: colors.light.foreground, fontSize: 18, fontWeight: '800', marginTop: 6 },
  emptyText: { color: colors.light.mutedForeground, fontSize: 12, textAlign: 'center' },
  suggestions: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'center', gap: 7, paddingHorizontal: 12, paddingBottom: 8 },
  suggestion: { paddingHorizontal: 11, paddingVertical: 8, borderRadius: 13, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border },
  suggestionText: { color: colors.light.primary, fontSize: 10, fontWeight: '700' },
  bubble: { maxWidth: '86%', paddingHorizontal: 14, paddingVertical: 11, borderRadius: 17, marginBottom: 10 },
  messageGroup: { maxWidth: '92%', marginBottom: 7 },
  userGroup: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  assistantGroup: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.light.primary, borderBottomRightRadius: 5 },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, borderBottomLeftRadius: 5 },
  bubbleText: { color: colors.light.foreground, fontSize: 14, lineHeight: 23, textAlign: 'right' },
  generatedImage: { width: 240, height: 240, borderRadius: 14, marginTop: 10, backgroundColor: colors.light.muted },
  messageActions: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 6, marginBottom: 6 },
  actionDivider: { width: 1, height: 14, backgroundColor: colors.light.border },
  typing: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, padding: 11, marginBottom: 8, borderRadius: 15, backgroundColor: colors.light.card },
  typingDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.light.primary },
  typingText: { color: colors.light.mutedForeground, fontSize: 11, marginLeft: 4 },
  composerArea: { paddingHorizontal: 13, paddingTop: 9, borderTopWidth: 1, borderTopColor: colors.light.border, backgroundColor: 'transparent' },
  toolBar: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, height: 40, paddingHorizontal: 13, paddingBottom: 7 },
  toolChip: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 12, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border },
  toolChipText: { color: colors.light.mutedForeground, fontSize: 10, fontWeight: '700' },
  attachmentMenu: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 9, padding: 12, marginBottom: 8, borderRadius: 18, backgroundColor: colors.light.surfaceOverlay, borderWidth: 1, borderColor: colors.light.border },
  attachmentUsage: { width: '100%', color: colors.light.mutedForeground, fontSize: 10, textAlign: 'right', marginBottom: 2 },
  attachmentItem: { width: '21%', alignItems: 'center', gap: 4 },
  attachmentIcon: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#122850' },
  attachmentText: { color: colors.light.mutedForeground, fontSize: 9 },
  composer: { flexDirection: 'row-reverse', alignItems: 'flex-end', gap: 8, padding: 6, borderRadius: 18, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border },
  attachButton: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.primary },
  attachButtonOpen: { backgroundColor: colors.light.accent },
  input: { flex: 1, minHeight: 42, maxHeight: 110, color: colors.light.foreground, textAlign: 'right', fontSize: 13, paddingHorizontal: 9, paddingTop: 10 },
  send: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.primary },
  sendDisabled: { opacity: 0.35 },
  error: { color: colors.light.destructive, fontSize: 11, textAlign: 'center', marginBottom: 6, paddingHorizontal: 15 },
  disclaimer: { color: colors.light.mutedForeground, fontSize: 9, textAlign: 'center', marginTop: 7 },
});
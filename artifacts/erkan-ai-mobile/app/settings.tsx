import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { changePassword, updateProfile } from '@/lib/mobile-api';
import colors from '@/constants/colors';
import { ActionRow, ScreenBackground, SectionLabel, TopBar } from '@/components/MobileChrome';

type ModalKind = 'profile' | 'password' | null;

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut, updateUser } = useAuth();
  const { options, themeId } = useTheme();
  const [modal, setModal] = useState<ModalKind>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [gender, setGender] = useState<'male' | 'female' | null>(user?.gender ?? null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState('');
  const dialectName = ({ syrian: 'سوريا', egyptian: 'مصر', gulf: 'الخليج', iraqi: 'العراق', lebanese: 'لبنان', jordanian: 'الأردن', palestinian: 'فلسطين', algerian: 'الجزائر', moroccan: 'المغرب', tunisian: 'تونس', turkish: 'Türkçe' } as Record<string, string>)[user?.country ?? ''] ?? 'العربية · السورية';
  const logout = async () => { await signOut(); router.replace('/'); };
  const openProfile = () => { setName(user?.name ?? ''); setUsername(user?.username ?? ''); setBio(user?.bio ?? ''); setGender(user?.gender ?? null); setModal('profile'); };
  const saveProfile = async () => {
    if (!name.trim() || !username.trim()) { setNotice('أدخل الاسم واسم المستخدم.'); return; }
    setBusy(true);
    try { const updated = await updateProfile({ name: name.trim(), username: username.trim(), bio: bio.trim(), gender: gender ?? undefined }); updateUser(updated); setModal(null); setNotice('تم تحديث ملفك الشخصي.'); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'تعذر حفظ الملف.'); }
    finally { setBusy(false); }
  };
  const savePassword = async () => {
    if (newPassword.length < 8) { setNotice('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.'); return; }
    if (newPassword !== confirmPassword) { setNotice('أعد كتابة كلمة المرور الجديدة.'); return; }
    setBusy(true);
    try { await changePassword(currentPassword, newPassword); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setModal(null); setNotice('تم تغيير كلمة المرور.'); }
    catch (error) { setNotice(error instanceof Error ? error.message : 'تحقق من كلمة المرور الحالية.'); }
    finally { setBusy(false); }
  };
  return (
    <KeyboardAvoidingView style={styles.keyboard} behavior="padding">
       <ScreenBackground><ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 24 }}>
        <TopBar title="الإعدادات" subtitle="إدارة حسابك وتفضيلاتك" />
         {notice && <View style={styles.notice}><Feather name="check-circle" size={16} color={colors.light.success} /><Text style={styles.noticeText}>{notice}</Text><Pressable onPress={() => setNotice('')}><Feather name="x" size={15} color={colors.light.mutedForeground} /></Pressable></View>}
        <SectionLabel>الحساب</SectionLabel>
        <ActionRow icon="user" title="تعديل الملف الشخصي" description={`${user?.name ?? ''} · @${user?.username ?? ''}`} onPress={openProfile} />
        <SectionLabel>التطبيق</SectionLabel>
        <ActionRow icon="globe" title="اللغة واللهجة" description={dialectName} onPress={() => router.push('/language')} />
        <ActionRow icon="sun" title="المظهر" description={options.find(option => option.id === themeId)?.title ?? 'كحلي ليلي'} onPress={() => router.push('/theme')} />
        <ActionRow icon="bell" title="الإشعارات" description="آخر التنبيهات والتحديثات" onPress={() => router.push('/notifications')} />
        <SectionLabel>الخصوصية</SectionLabel>
        <ActionRow icon="shield" title="الأمان والخصوصية" onPress={() => router.push('/privacy')} />
        <ActionRow icon="file-text" title="سياسة الخصوصية" onPress={() => router.push({ pathname: '/legal', params: { kind: 'privacy' } })} />
        <ActionRow icon="file-text" title="شروط الاستخدام" onPress={() => router.push({ pathname: '/legal', params: { kind: 'terms' } })} />
        <SectionLabel>الدعم</SectionLabel>
        <ActionRow icon="code" title="معلومات المطور" description="ERKAN AI · TRSY" onPress={() => router.push('/devinfo')} />
        {user?.userId === 'LMR-22534321' && <ActionRow icon="shield" title="لوحة الإدارة" description="إدارة الحسابات والتوثيق من الجوال" onPress={() => router.push('/admin')} />}
        <Pressable onPress={logout} style={styles.logout}><Feather name="log-out" size={18} color={colors.light.destructive} /><Text style={styles.logoutText}>تسجيل الخروج</Text></Pressable>
        <Text style={styles.version}>ERKAN AI · v2.0.0</Text>
      </ScrollView></ScreenBackground>
      <Modal visible={modal !== null} transparent animationType="slide" onRequestClose={() => !busy && setModal(null)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <View style={styles.modalHeader}><Pressable disabled={busy} onPress={() => setModal(null)}><Feather name="x" size={20} color={colors.light.mutedForeground} /></Pressable><Text style={styles.modalTitle}>{modal === 'profile' ? 'تعديل الملف الشخصي' : 'تغيير كلمة المرور'}</Text></View>
          {modal === 'profile' ? <><Field label="الاسم" value={name} onChangeText={setName} /><Field label="اسم المستخدم" value={username} onChangeText={setUsername} autoCapitalize="none" /><Field label="النبذة" value={bio} onChangeText={setBio} multiline /><Text style={styles.fieldLabel}>الجنس</Text><View style={styles.genderRow}><Pressable onPress={() => setGender(gender === 'male' ? null : 'male')} style={[styles.genderButton, gender === 'male' && styles.genderButtonSelected]}><Text style={[styles.genderText, gender === 'male' && styles.genderTextSelected]}>ذكر</Text></Pressable><Pressable onPress={() => setGender(gender === 'female' ? null : 'female')} style={[styles.genderButton, gender === 'female' && styles.genderButtonSelected]}><Text style={[styles.genderText, gender === 'female' && styles.genderTextSelected]}>أنثى</Text></Pressable></View><PrimaryButton label="حفظ التغييرات" busy={busy} onPress={saveProfile} /></> : <><Field label="كلمة المرور الحالية" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry /><Field label="كلمة المرور الجديدة" value={newPassword} onChangeText={setNewPassword} secureTextEntry /><Field label="تأكيد كلمة المرور الجديدة" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry /><PrimaryButton label="تغيير كلمة المرور" busy={busy} onPress={savePassword} /></>}
        </View></View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChangeText, secureTextEntry, multiline, autoCapitalize }: { label: string; value: string; onChangeText: (value: string) => void; secureTextEntry?: boolean; multiline?: boolean; autoCapitalize?: 'none' | 'sentences' }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChangeText} secureTextEntry={secureTextEntry} multiline={multiline} autoCapitalize={autoCapitalize} placeholderTextColor={colors.light.mutedForeground} style={[styles.input, multiline && styles.multiline]} /></View>;
}
function PrimaryButton({ label, busy, onPress }: { label: string; busy: boolean; onPress: () => void }) {
  return <Pressable disabled={busy} onPress={onPress} style={styles.primaryButton}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{label}</Text>}</Pressable>;
}
function SettingRow({ icon, title, description, onPress, danger = false }: { icon: keyof typeof Feather.glyphMap; title: string; description?: string; onPress: () => void; danger?: boolean }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]}><View style={[styles.rowIcon, danger && { backgroundColor: '#401b2d' }]}><Feather name={icon} size={18} color={danger ? colors.light.destructive : colors.light.primary} /></View><View style={styles.rowText}><Text style={[styles.rowTitle, danger && { color: colors.light.destructive }]}>{title}</Text>{description && <Text style={styles.rowDescription}>{description}</Text>}</View><Feather name="chevron-left" size={18} color={colors.light.mutedForeground} /></Pressable>;
}
const styles = StyleSheet.create({
   keyboard: { flex: 1, backgroundColor: colors.light.background }, screen: { flex: 1, backgroundColor: colors.light.background, paddingHorizontal: 18 }, notice: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, padding: 12, marginBottom: 12, borderRadius: 14, backgroundColor: colors.light.primarySoft, borderWidth: 1, borderColor: colors.light.primary }, noticeText: { flex: 1, color: colors.light.foreground, fontSize: 11, textAlign: 'right' }, header: { flexDirection: 'row-reverse', alignItems: 'center', gap: 13, marginBottom: 24 }, back: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border }, title: { flex: 1, color: colors.light.foreground, fontSize: 21, fontWeight: '800', textAlign: 'right' }, profile: { flexDirection: 'row-reverse', alignItems: 'center', gap: 13, padding: 17, borderRadius: 19, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, marginBottom: 26 }, avatar: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.blueSurface }, avatarText: { color: colors.light.primary, fontSize: 23, fontWeight: '900' }, name: { color: colors.light.foreground, fontSize: 15, fontWeight: '800', textAlign: 'right' }, email: { color: colors.light.mutedForeground, fontSize: 11, marginTop: 4, textAlign: 'right' }, editIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.blueSurface }, group: { color: colors.light.mutedForeground, fontSize: 11, fontWeight: '700', textAlign: 'right', marginBottom: 9, marginRight: 4, marginTop: 4 }, row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, minHeight: 60, paddingHorizontal: 14, borderRadius: 15, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, marginBottom: 9 }, rowIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.blueSurface }, rowTitle: { flex: 1, color: colors.light.foreground, textAlign: 'right', fontSize: 13, fontWeight: '700' }, rowText: { flex: 1 }, rowDescription: { color: colors.light.mutedForeground, textAlign: 'right', fontSize: 10, marginTop: 3 }, logout: { minHeight: 56, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 9, marginTop: 18, borderRadius: 15, borderWidth: 1, borderColor: colors.light.border, backgroundColor: colors.light.card }, logoutText: { color: colors.light.destructive, fontSize: 13, fontWeight: '800' }, version: { color: colors.light.mutedForeground, textAlign: 'center', fontSize: 10, marginTop: 24 }, modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.light.background }, modalCard: { padding: 20, paddingBottom: 32, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: colors.light.background, borderTopWidth: 1, borderColor: colors.light.border }, modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }, modalTitle: { color: colors.light.foreground, fontSize: 18, fontWeight: '800' }, field: { marginBottom: 12 }, fieldLabel: { color: colors.light.mutedForeground, fontSize: 11, textAlign: 'right', marginBottom: 6 }, input: { minHeight: 46, paddingHorizontal: 13, borderRadius: 13, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border, color: colors.light.foreground, textAlign: 'right', fontSize: 13 }, multiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 }, genderRow: { flexDirection: 'row-reverse', gap: 8, marginBottom: 10 }, genderButton: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 12, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border }, genderButtonSelected: { backgroundColor: colors.light.primarySoft, borderColor: colors.light.primary }, genderText: { color: colors.light.mutedForeground, fontSize: 12, fontWeight: '700' }, genderTextSelected: { color: colors.light.foreground }, primaryButton: { minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.primary, marginTop: 8 }, primaryButtonText: { color: colors.light.primaryForeground, fontSize: 13, fontWeight: '800' },
});
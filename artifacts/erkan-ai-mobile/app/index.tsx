import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useAuth } from '@/contexts/AuthContext';
import colors from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { AnimatedErkanLogo } from '@/components/AnimatedErkanLogo';

export default function IndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    user,
    loading,
    error,
    requiresTwoFactor,
    googleTwoFactorPending,
    signIn,
    signUp,
    signInWithGoogle,
    completeGoogleSignIn,
    clearError,
  } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  React.useEffect(() => {
    if (user) router.replace(showWelcome ? '/welcome' : '/chat');
  }, [router, showWelcome, user]);
  if (loading) {
    return <View style={styles.loading}><ActivityIndicator color={colors.light.primary} size="large" /></View>;
  }

  const submit = async () => {
    clearError();
    const completingGoogleTwoFactor = requiresTwoFactor && googleTwoFactorPending && mode === 'login';
    if (completingGoogleTwoFactor) {
      if (twoFactorCode.trim().length !== 6) return;
    } else if (!email.trim() || password.length < 6 || (mode === 'register' && (!name.trim() || password !== confirmPassword))) {
      return;
    }
    if (mode === 'register' && !accepted) return;
    setSubmitting(true);
    try {
      if (completingGoogleTwoFactor) {
        await completeGoogleSignIn(twoFactorCode.trim());
      }
      else if (mode === 'login') await signIn(email.trim(), password, twoFactorCode.trim());
      else { await signUp(name.trim(), email.trim(), password); setShowWelcome(true); }
    } finally { setSubmitting(false); }
  };

  return (
    <View style={styles.authRoot}>
      <View pointerEvents="none" style={styles.authGlowTop} />
      <View pointerEvents="none" style={styles.authGlowBottom} />
      <View pointerEvents="none" style={styles.particles}>{Array.from({ length: 18 }, (_, index) => <View key={index} style={[styles.particle, { left: `${(index * 47) % 96}%`, top: `${(index * 71) % 88}%`, opacity: 0.22 + (index % 4) * 0.1 }]} />)}</View>
      <KeyboardAwareScrollViewCompat
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        <Animated.View entering={ZoomIn.duration(650)} style={styles.brand}>
           <AnimatedErkanLogo size={154} variant="circular" testID="login-logo" />
          <Text style={styles.brandName}>ERKAN <Text style={styles.brandAccent}>AI</Text></Text>
          <Text style={styles.tagline}>ذكاء عربي بلا حدود</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(120).duration(500)} style={styles.welcome}>
          <Text style={styles.welcomeTitle}>أهلاً بك في ERKAN AI</Text>
          <Text style={styles.welcomeSub}>مساعدك العربي الذكي للكتابة، التعلم، والعمل</Text>
        </Animated.View>
        <View style={styles.segment}>
          <Pressable onPress={() => { Haptics.selectionAsync(); setMode('login'); clearError(); }} style={[styles.segmentItem, mode === 'login' && styles.segmentActive]}>
            {mode === 'login' ? <LinearGradient colors={['#1f8bff33', '#a855f733']} style={styles.segmentGradient}><Text style={styles.segmentTextActive}>تسجيل الدخول</Text></LinearGradient> : <Text style={styles.segmentText}>تسجيل الدخول</Text>}
          </Pressable>
          <Pressable onPress={() => { Haptics.selectionAsync(); setMode('register'); clearError(); }} style={[styles.segmentItem, mode === 'register' && styles.segmentActive]}>
            {mode === 'register' ? <LinearGradient colors={['#1f8bff33', '#a855f733']} style={styles.segmentGradient}><Text style={styles.segmentTextActive}>حساب جديد</Text></LinearGradient> : <Text style={styles.segmentText}>حساب جديد</Text>}
          </Pressable>
        </View>

        <Animated.View entering={FadeInUp.delay(180).duration(550)} style={styles.card}>
          {error && <View style={styles.errorBanner}><Feather name="alert-circle" size={16} color="#ef4444" /><Text style={styles.error}>{error}</Text></View>}
          {mode === 'login' ? <>
            <Field icon="mail" value={email} onChangeText={setEmail} placeholder="البريد الإلكتروني" keyboardType="email-address" />
            {requiresTwoFactor && <Field icon="shield" value={twoFactorCode} onChangeText={value => setTwoFactorCode(value.replace(/\D/g, '').slice(0, 6))} placeholder="رمز المصادقة الثنائية" keyboardType="number-pad" maxLength={6} />}
            <Field icon="key" value={password} onChangeText={setPassword} placeholder="كلمة المرور" secureTextEntry={!showPassword} trailing={<Pressable onPress={() => setShowPassword(value => !value)}><Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#6382dc88" /></Pressable>} />
            <View style={styles.options}><Pressable onPress={() => setRemember(value => !value)} style={styles.remember}><View style={[styles.check, remember && styles.checkOn]}>{remember && <Feather name="check" size={12} color="#fff" />}</View><Text style={styles.rememberText}>تذكرني</Text></Pressable><Pressable onPress={() => undefined}><Text style={styles.forgot}>نسيت كلمة المرور؟</Text></Pressable></View>
          </> : <>
            <Field icon="user" value={name} onChangeText={setName} placeholder="الاسم الكامل" />
            <Field icon="mail" value={email} onChangeText={setEmail} placeholder="البريد الإلكتروني" keyboardType="email-address" />
            <Field icon="key" value={password} onChangeText={setPassword} placeholder="كلمة المرور" secureTextEntry={!showPassword} />
            <Field icon="key" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="تأكيد كلمة المرور" secureTextEntry={!showPassword} />
            <View style={styles.consentRow}><Pressable testID="legal-consent" onPress={() => setAccepted(value => !value)} style={[styles.checkbox, accepted && styles.checkboxChecked]}>{accepted && <Text style={styles.checkmark}>✓</Text>}</Pressable><Text style={styles.consentText}>أوافق على <Text onPress={() => router.push({ pathname: '/legal', params: { kind: 'privacy' } })} style={styles.link}>سياسة الخصوصية</Text> و<Text onPress={() => router.push({ pathname: '/legal', params: { kind: 'terms' } })} style={styles.link}> شروط الاستخدام</Text></Text></View>
          </>}
          <Pressable testID="auth-submit" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); submit(); }} disabled={submitting} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, submitting && styles.disabled]}>
            <LinearGradient colors={['#1f8bff', '#a855f7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.gradientButton}>{submitting ? <ActivityIndicator color="#fff" /> : <><Feather name={mode === 'login' ? 'log-in' : 'user-plus'} size={19} color="#fff" /><Text style={styles.primaryText}>{mode === 'login' ? 'دخول إلى ERKAN AI' : 'إنشاء الحساب'}</Text></>}</LinearGradient>
          </Pressable>
          <View style={styles.orLine}><View style={styles.line} /><Text style={styles.orText}>أو</Text><View style={styles.line} /></View>
          <Pressable testID="google-sign-in" onPress={() => void signInWithGoogle(mode === 'register')} disabled={submitting || loading} style={({ pressed }) => [styles.googleButton, pressed && styles.pressed, (submitting || loading) && styles.disabled]}><Text style={styles.googleMark}>G</Text><Text style={styles.googleText}>{mode === 'register' ? 'التسجيل باستخدام Google' : 'المتابعة باستخدام Google'}</Text></Pressable>
          <View style={styles.bottomText}><Text style={styles.bottomGray}>{mode === 'login' ? 'ليس لديك حساب؟ ' : 'لديك حساب بالفعل؟ '}</Text><Pressable onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); clearError(); }}><Text style={styles.bottomLink}>{mode === 'login' ? 'إنشاء حساب' : 'تسجيل الدخول'}</Text></Pressable></View>
        </Animated.View>
        <View style={styles.footer}><Feather name="shield" size={14} color="#6366f1" /><Text style={styles.footerText}>بياناتك محمية وتبقى تحت سيطرتك</Text></View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function Field({ icon, value, onChangeText, placeholder, secureTextEntry, keyboardType, maxLength, trailing }: { icon: keyof typeof Feather.glyphMap; value: string; onChangeText: (value: string) => void; placeholder: string; secureTextEntry?: boolean; keyboardType?: 'email-address' | 'number-pad'; maxLength?: number; trailing?: React.ReactNode }) {
  return <View style={styles.field}><Feather name={icon} size={18} color="#6382dc8c" /><TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#6e82c360" keyboardType={keyboardType} autoCapitalize="none" secureTextEntry={secureTextEntry} maxLength={maxLength} style={styles.fieldInput} />{trailing}</View>;
}

const styles = StyleSheet.create({
  authRoot: { flex: 1, backgroundColor: colors.light.background, overflow: 'hidden' },
  screen: { flex: 1, backgroundColor: colors.light.background },
  content: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 20 },
  authGlowTop: { position: 'absolute', top: -140, left: -80, right: -80, height: 320, borderRadius: 180, backgroundColor: colors.light.backgroundTop, opacity: 0.9 },
  authGlowBottom: { position: 'absolute', bottom: -180, left: 30, right: 30, height: 260, borderRadius: 180, backgroundColor: colors.light.secondary, opacity: 0.18 },
  particles: StyleSheet.absoluteFill,
  particle: { position: 'absolute', width: 3, height: 3, borderRadius: 2, backgroundColor: colors.light.secondary, shadowColor: colors.light.primary, shadowOpacity: 0.9, shadowRadius: 6 },
  loading: { flex: 1, backgroundColor: colors.light.background, alignItems: 'center', justifyContent: 'center' },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.light.background, overflow: 'hidden' },
  splashTopGlow: { position: 'absolute', top: -180, left: -80, right: -80, height: 420, borderRadius: 220, backgroundColor: colors.light.backgroundTop, opacity: 0.86 },
  splashCenterGlow: { position: 'absolute', top: '25%', left: '50%', width: 360, height: 360, marginLeft: -180, borderRadius: 180, backgroundColor: colors.light.secondary, opacity: 0.12, shadowColor: colors.light.secondary, shadowOpacity: 0.6, shadowRadius: 55 },
  splashContent: { alignItems: 'center', width: '100%', paddingHorizontal: 30 },
  splashLogoWrap: { width: 200, height: 200, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  splashHaloOuter: { position: 'absolute', inset: -14, borderRadius: 110, backgroundColor: '#8a2eff2b', shadowColor: '#8a2eff', shadowOpacity: 0.8, shadowRadius: 25 },
  splashHaloMid: { position: 'absolute', inset: 4, borderRadius: 100, borderWidth: 1, borderColor: '#a855f738', shadowColor: '#1f8bff', shadowOpacity: 0.7, shadowRadius: 24 },
  splashRing: { position: 'absolute', inset: 0, borderRadius: 100, borderWidth: 2, borderTopColor: '#1f8bff', borderRightColor: '#a855f7', borderBottomColor: 'transparent', borderLeftColor: 'transparent', transform: [{ rotate: '-35deg' }] },
  splashGlass: { width: 162, height: 162, borderRadius: 81, backgroundColor: '#10183aeb', borderWidth: 1, borderColor: '#1f8bff30', overflow: 'hidden', shadowColor: '#1f8bff', shadowOpacity: 0.35, shadowRadius: 25 },
  splashImage: { width: '100%', height: '100%', borderRadius: 81 },
  splashName: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 31, fontWeight: '900', letterSpacing: 5 },
  splashTag: { color: '#acbad7b3', fontFamily: 'Cairo_400Regular', fontSize: 12, marginTop: 9 },
  splashLoader: { width: '100%', alignItems: 'center', gap: 11, marginTop: 39 },
  splashLine: { width: '100%', maxWidth: 248, height: 5, borderRadius: 100, backgroundColor: '#ffffff0f', borderWidth: 1, borderColor: '#1f8bff1a', overflow: 'visible' },
  splashProgress: { height: '100%', borderRadius: 100, backgroundColor: '#a855f7', shadowColor: '#a855f7', shadowOpacity: 0.9, shadowRadius: 10 },
  splashLoadingText: { color: '#8c9ec49b', fontSize: 10 },
  splashPct: { flexDirection: 'row-reverse', alignItems: 'baseline', gap: 2, marginTop: -1 },
  splashPctValue: { color: '#a855f7', fontSize: 48, lineHeight: 52, fontWeight: '900', textShadowColor: '#a855f799', textShadowRadius: 14 },
  splashPctSign: { color: '#818cf4', fontSize: 21, fontWeight: '700' },
  brand: { width: '100%', alignItems: 'center', marginBottom: 19 },
  loginLogoWrap: { width: 154, height: 154, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  haloOuter: { position: 'absolute', inset: -10, borderRadius: 90, backgroundColor: '#3d1c8d', opacity: 0.2, shadowColor: '#8a2eff', shadowOpacity: 0.8, shadowRadius: 25 },
  haloMid: { position: 'absolute', inset: 6, borderRadius: 80, borderWidth: 1, borderColor: '#8a2eff55', shadowColor: '#1f8bff', shadowOpacity: 0.7, shadowRadius: 15 },
  ringSpin: { position: 'absolute', inset: 0, borderRadius: 80, borderWidth: 2, borderTopColor: '#1f8bff', borderRightColor: '#a855f7', borderBottomColor: 'transparent', borderLeftColor: 'transparent', transform: [{ rotate: '-35deg' }] },
  loginLogoGlass: { width: 124, height: 124, borderRadius: 62, backgroundColor: '#10183a', borderWidth: 1, borderColor: '#1f8bff55', overflow: 'hidden', shadowColor: '#1f8bff', shadowOpacity: 0.35, shadowRadius: 20 },
  loginLogo: { width: '100%', height: '100%', borderRadius: 62 },
  brandName: { color: colors.light.foreground, fontFamily: 'Inter_700Bold', fontSize: 32, fontWeight: '900', letterSpacing: 5 },
  brandAccent: { color: colors.light.secondary },
  tagline: { color: '#a0b4e6aa', fontFamily: Platform.OS === 'web' ? 'Cairo' : 'sans-serif', marginTop: 6, fontSize: 12 },
  welcome: { width: '100%', alignItems: 'center', marginBottom: 17 },
  welcomeTitle: { color: '#fff', fontSize: 19, fontWeight: '800', lineHeight: 27 },
  welcomeSub: { color: '#9baddc99', fontSize: 11, lineHeight: 19, marginTop: 4, textAlign: 'center' },
  audioCard: { width: '100%', flexDirection: 'row-reverse', alignItems: 'center', gap: 9, padding: 9, marginBottom: 14, borderRadius: 15, borderWidth: 1, borderColor: '#5c9dff3d', backgroundColor: '#1a52b12e' },
  audioIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#157ed633' },
  audioCopy: { flex: 1 },
  audioTitle: { color: '#e7f4ff', textAlign: 'right', fontSize: 11, fontWeight: '700' },
  audioSub: { color: '#c0daff9e', textAlign: 'right', fontSize: 9, marginTop: 1 },
  audioPlay: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1887de3d', borderWidth: 1, borderColor: '#68c7ff59' },
  segment: { width: '100%', flexDirection: 'row', backgroundColor: '#10183a', borderRadius: 16, padding: 4, gap: 4, marginBottom: 14, borderWidth: 1, borderColor: '#ffffff12' },
  segmentItem: { flex: 1, minHeight: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  segmentActive: { borderWidth: 1, borderColor: '#1f8bff59' },
  segmentGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', borderRadius: 11 },
  segmentText: { color: '#96a8dc8c', fontSize: 12, fontWeight: '600' },
  segmentTextActive: { color: '#fff', fontSize: 12, fontWeight: '700' },
  card: { width: '100%', backgroundColor: '#10183ad1', borderRadius: 24, borderWidth: 1, borderColor: '#ffffff14', padding: 20, gap: 12, shadowColor: '#1f8bff', shadowOpacity: 0.08, shadowRadius: 24 },
  field: { minHeight: 51, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: '#10183abf', borderWidth: 1, borderColor: '#ffffff14' },
  fieldInput: { flex: 1, color: '#d7e2fae0', textAlign: 'right', fontSize: 12, paddingVertical: 0 },
  consentRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: 9, marginTop: 2, marginBottom: 14 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1, borderColor: colors.light.border, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxChecked: { backgroundColor: colors.light.primary, borderColor: colors.light.primary },
  checkmark: { color: '#fff', fontWeight: '800', fontSize: 15 },
  consentText: { flex: 1, color: colors.light.mutedForeground, textAlign: 'right', lineHeight: 20, fontSize: 11 },
  link: { color: colors.light.primary, textDecorationLine: 'underline' },
  errorBanner: { flexDirection: 'row-reverse', alignItems: 'center', gap: 9, padding: 10, borderRadius: 12, backgroundColor: '#ef44441a', borderWidth: 1, borderColor: '#ef444433' },
  error: { flex: 1, color: '#fca5a5', textAlign: 'right', fontSize: 11 },
  options: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2, marginTop: -2 },
  remember: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7 },
  check: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, borderColor: '#a855f759', backgroundColor: '#10183abf', alignItems: 'center', justifyContent: 'center' },
  checkOn: { backgroundColor: '#1f8bff', borderColor: '#1f8bff' },
  rememberText: { color: '#96a8d7a6', fontSize: 10 },
  primaryButton: { minHeight: 52, borderRadius: 14, overflow: 'hidden', marginTop: 2 },
  gradientButton: { flex: 1, minHeight: 52, width: '100%', flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 10 },
  pressed: { opacity: 0.78 },
  disabled: { opacity: 0.6 },
  primaryText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  forgot: { color: '#a855f7', fontSize: 10, fontWeight: '700', textAlign: 'right' },
  orLine: { flexDirection: 'row', alignItems: 'center', gap: 9, marginVertical: 10 },
  line: { flex: 1, height: 1, backgroundColor: '#ffffff0f' },
  orText: { color: '#8ca0c880', fontSize: 10 },
  googleButton: { minHeight: 50, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 16, backgroundColor: '#ffffff05', borderWidth: 1, borderColor: '#ffffff1a' },
  googleMark: { color: '#fff', fontSize: 17, fontWeight: '900' },
  googleText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  bottomText: { flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  bottomGray: { color: '#8ca0c88c', fontSize: 11 },
  bottomLink: { color: '#1f8bff', fontSize: 11, fontWeight: '700' },
  footer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 7, paddingTop: 24, paddingBottom: 5 },
  footerText: { color: '#6478a073', fontSize: 10 },
  input: { height: 52, borderRadius: 14, paddingHorizontal: 15, color: colors.light.foreground, backgroundColor: colors.light.background, borderWidth: 1, borderColor: colors.light.input, marginBottom: 11, textAlign: 'right', fontSize: 14 },
  loginExtras: { marginTop: -2, marginBottom: 12 },
  hint: { color: colors.light.mutedForeground, textAlign: 'center', fontSize: 11, marginTop: 14 },
});

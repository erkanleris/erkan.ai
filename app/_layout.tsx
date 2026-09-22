import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
} from '@expo-google-fonts/cairo';
import { Stack, useRouter } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { setAuthTokenGetter, setBaseUrl } from '@workspace/api-client-react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LocaleProvider, useMobileLocale } from '@/contexts/LocaleContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { getPushNotificationRoute } from '@/lib/push-notifications';
import { ScreenBackground } from '@/components/MobileChrome';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
import { getAuthToken } from '@/lib/mobile-api';

const queryClient = new QueryClient();
setBaseUrl(process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}` : null);
setAuthTokenGetter(getAuthToken);

function RootLayoutNav() {
  const router = useRouter();
  const { themeId, theme } = useTheme();
  const { accountRestriction, signOut } = useAuth();
  const { isRtl } = useMobileLocale();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const openNotification = (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as { type?: string; conversationId?: string | number };
      router.push(getPushNotificationRoute(data) as never);
    };
    const subscription = Notifications.addNotificationResponseReceivedListener(openNotification);
    void Notifications.getLastNotificationResponseAsync().then(response => {
      if (response) openNotification(response);
    });
    return () => subscription.remove();
  }, [router]);

  return <View style={{ flex: 1, direction: isRtl ? 'rtl' : 'ltr' }}>
   <ScreenBackground>
    <StatusBar style={themeId === 'light' ? 'dark' : 'light'} />
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="chat" />
      <Stack.Screen name="legal" />
      <Stack.Screen name="settings" />
    </Stack>
    <Modal visible={Boolean(accountRestriction)} transparent animationType="fade" onRequestClose={() => undefined}>
      <View style={restrictionStyles.backdrop}>
          <View style={[restrictionStyles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[restrictionStyles.icon, { backgroundColor: theme.destructive + '26' }]}><Text style={[restrictionStyles.iconText, { color: theme.destructive }]}>!</Text></View>
          <Text style={[restrictionStyles.title, { color: theme.foreground }]}>تم تقييد الحساب</Text>
          <Text style={[restrictionStyles.message, { color: theme.mutedForeground }]}>
            {accountRestriction?.message ?? 'لا يمكنك استخدام التطبيق حالياً.'}
          </Text>
          {accountRestriction?.bannedUntil && (
            <Text style={[restrictionStyles.until, { color: theme.primary }]}>
              ينتهي الحظر في {new Date(accountRestriction.bannedUntil).toLocaleString('ar-EG')}
            </Text>
          )}
          <Pressable style={[restrictionStyles.primary, { backgroundColor: theme.primary }]} onPress={() => void Linking.openURL('https://www.instagram.com/erkan.ai')}>
            <Text style={restrictionStyles.primaryText}>التواصل عبر Instagram</Text>
          </Pressable>
          <Pressable style={restrictionStyles.secondary} onPress={() => void signOut()}>
            <Text style={[restrictionStyles.secondaryText, { color: theme.mutedForeground }]}>تسجيل الخروج</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
   </ScreenBackground>
  </View>;
}

const restrictionStyles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#020817cc' },
  card: { width: '100%', maxWidth: 380, padding: 22, borderRadius: 24, borderWidth: 1, alignItems: 'center' },
  icon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#54233d', marginBottom: 14 },
  iconText: { color: '#ff9caf', fontSize: 28, fontWeight: '900' },
  title: { fontSize: 20, fontWeight: '900', textAlign: 'center' },
  message: { fontSize: 12, lineHeight: 21, textAlign: 'center', marginTop: 10 },
  until: { fontSize: 11, textAlign: 'center', marginTop: 10, fontWeight: '700' },
  primary: { width: '100%', minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  primaryText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  secondary: { padding: 12 },
  secondaryText: { fontSize: 12, fontWeight: '700' },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <LocaleProvider>
                <GestureHandlerRootView>
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </LocaleProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

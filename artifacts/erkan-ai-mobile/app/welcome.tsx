import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { PrimaryButton, ScreenBackground } from '@/components/MobileChrome';
import colors from '@/constants/colors';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  return (
    <ScreenBackground>
      <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.content}>
          <MaterialCommunityIcons name="creation" size={64} color={colors.light.primary} />
          <Text style={styles.title}>مرحباً بك في ERKAN AI</Text>
          <Text style={styles.description}>مساعدك العربي الذكي للكتابة، التعلم، العمل، وإنجاز كل ما تحتاجه بطريقة أبسط.</Text>
          <PrimaryButton onPress={() => router.replace('/chat')}>متابعة</PrimaryButton>
        </View>
      </View>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  content: { width: '100%', alignItems: 'center' },
  title: { color: colors.light.foreground, fontSize: 24, fontWeight: '800', textAlign: 'center', marginTop: 20 },
  description: { color: colors.light.mutedForeground, fontSize: 14, lineHeight: 23, textAlign: 'center', marginTop: 12, marginBottom: 28 },
});
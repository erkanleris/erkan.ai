import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import colors from '@/constants/colors';
import { Feather } from '@expo/vector-icons';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'ERKAN AI' }} />
      <View style={[styles.container, { backgroundColor: colors.light.background }]}>
        <View style={styles.card}>
          <View style={styles.heading}><Feather name="alert-circle" size={30} color={colors.light.destructive} /><Text style={[styles.title, { color: colors.light.foreground }]}>404 Page Not Found</Text></View>
          <Text style={styles.description}>Did you forget to add the page to the router?</Text>

        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { color: colors.light.primary }]}>
            العودة إلى الرئيسية
          </Text>
        </Link>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: { width: '100%', maxWidth: 420, padding: 22, borderRadius: 18, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border },
  heading: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
  },
  description: { color: colors.light.mutedForeground, fontSize: 12, marginTop: 18, textAlign: 'right' },
});

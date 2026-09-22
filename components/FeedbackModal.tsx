import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import colors from '@/constants/colors';

export function FeedbackModal({ title, message, onClose, action, actionLabel = 'حسناً' }: {
  title: string; message: string; onClose: () => void; action?: () => void; actionLabel?: string;
}) {
  return <Modal transparent animationType="fade" visible onRequestClose={onClose}>
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable style={styles.card} onPress={event => event.stopPropagation()}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <Pressable onPress={onClose} style={styles.secondary}><Text style={styles.secondaryText}>إغلاق</Text></Pressable>
          {action && <Pressable onPress={() => { onClose(); action(); }} style={styles.primary}><Text style={styles.primaryText}>{actionLabel}</Text></Pressable>}
        </View>
      </Pressable>
    </Pressable>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000099' },
  card: { padding: 20, paddingBottom: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.light.background, borderTopWidth: 1, borderColor: colors.light.border },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: colors.light.mutedForeground, opacity: .5, marginBottom: 18 },
  title: { color: colors.light.foreground, fontSize: 17, fontWeight: '900', textAlign: 'right' },
  message: { color: colors.light.mutedForeground, fontSize: 12, lineHeight: 20, textAlign: 'right', marginTop: 9 },
  actions: { flexDirection: 'row-reverse', gap: 9, marginTop: 18 },
  primary: { flex: 1, minHeight: 46, borderRadius: 13, backgroundColor: colors.light.primary, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#fff', fontWeight: '800' },
  secondary: { flex: 1, minHeight: 46, borderRadius: 13, backgroundColor: colors.light.secondary, borderWidth: 1, borderColor: colors.light.border, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: colors.light.foreground, fontWeight: '700' },
});
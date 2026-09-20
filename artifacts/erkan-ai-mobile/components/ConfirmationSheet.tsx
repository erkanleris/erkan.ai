import React from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import colors from '@/constants/colors';

export function ConfirmationSheet({ visible, title, message, cancelLabel = 'إلغاء', confirmLabel = 'تأكيد', busy = false, destructive = false, onCancel, onConfirm }: {
  visible: boolean; title: string; message: string; cancelLabel?: string; confirmLabel?: string; busy?: boolean; destructive?: boolean; onCancel: () => void; onConfirm: () => void;
}) {
  return <Modal transparent animationType="fade" visible={visible} onRequestClose={() => !busy && onCancel()}>
    <Pressable style={styles.backdrop} onPress={() => !busy && onCancel()}>
      <Pressable style={styles.card} onPress={event => event.stopPropagation()}>
        <View style={styles.handle} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <Pressable disabled={busy} onPress={onCancel} style={styles.cancel}><Text style={styles.cancelText}>{cancelLabel}</Text></Pressable>
          <Pressable disabled={busy} onPress={onConfirm} style={[styles.confirm, destructive && styles.destructive, busy && styles.disabled]}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>{confirmLabel}</Text>}
          </Pressable>
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
  cancel: { flex: 1, minHeight: 46, borderRadius: 13, backgroundColor: colors.light.secondary, borderWidth: 1, borderColor: colors.light.border, alignItems: 'center', justifyContent: 'center' },
  cancelText: { color: colors.light.foreground, fontWeight: '700' },
  confirm: { flex: 1, minHeight: 46, borderRadius: 13, backgroundColor: colors.light.primary, alignItems: 'center', justifyContent: 'center' },
  destructive: { backgroundColor: colors.light.destructive },
  disabled: { opacity: .55 },
  confirmText: { color: '#fff', fontWeight: '800' },
});
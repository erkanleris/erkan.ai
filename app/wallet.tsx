import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { ActionRow, GlowCard, Pill, PrimaryButton, SectionLabel, TopBar } from '@/components/MobileChrome';
import colors from '@/constants/colors';
import { depositWalletCode, getWallet, getWalletTransactions, purchaseSubscriptionWithWallet, transferWalletPoints, type WalletSubscriptionPurchaseResult, type WalletSummary, type WalletTransaction } from '@/lib/mobile-api';
import { useAuth } from '@/contexts/AuthContext';
import { FeedbackModal } from '@/components/FeedbackModal';
import { useMobileLocale } from '@/contexts/LocaleContext';

type Sheet = 'transfer' | 'deposit' | 'purchase' | null;
const purchasePlans = [
  { id: 'pro' as const, monthly: 1500, labelKey: 'walletPlanPro' as const },
  { id: 'pro_max' as const, monthly: 3600, labelKey: 'walletPlanProMax' as const },
];
const purchaseDurations = [30, 60, 90] as const;

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { t, formatDate } = useMobileLocale();
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [visible, setVisible] = useState(true);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [depositCode, setDepositCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [detail, setDetail] = useState<WalletTransaction | null>(null);
  const [purchasePlan, setPurchasePlan] = useState<'pro' | 'pro_max'>('pro');
  const [purchaseDuration, setPurchaseDuration] = useState<(typeof purchaseDurations)[number]>(30);
  const [purchaseResult, setPurchaseResult] = useState<WalletSubscriptionPurchaseResult | null>(null);
  const [purchaseBalanceBefore, setPurchaseBalanceBefore] = useState(0);
  const [feedback, setFeedback] = useState<{ title: string; message: string; action?: () => void; actionLabel?: string } | null>(null);
  const selectedPurchasePlan = purchasePlans.find(plan => plan.id === purchasePlan) ?? purchasePlans[0];
  const purchaseCost = selectedPurchasePlan.monthly * purchaseDuration / 30;
  const canPurchase = (wallet?.balance ?? 0) >= purchaseCost;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [summary, history] = await Promise.all([getWallet(), getWalletTransactions()]);
      setWallet(summary);
      setTransactions(history);
    } catch (error) {
      setFeedback({ title: 'تعذر تحميل المحفظة', message: error instanceof Error ? error.message : 'حاول مرة أخرى.', action: () => void load(), actionLabel: 'إعادة المحاولة' });
    } finally {
      setLoading(false);
    }
  }, []);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const submitTransfer = async () => {
    const numericAmount = Number(amount);
    const lmr = recipient.trim();
    const fee = Math.ceil(numericAmount * 0.1);
    setFormError('');
    if (!/^LMR-\d+$/i.test(lmr) || !Number.isInteger(numericAmount) || numericAmount <= 0) {
      setFormError('أدخل معرف LMR صالحاً ومبلغاً صحيحاً كاملاً أكبر من صفر.');
      return;
    }
    if (wallet && numericAmount + fee > wallet.balance) {
      setFormError(`الرصيد غير كافٍ. رسوم التحويل 10% (${fee} EKN).`);
      return;
    }
    setBusy(true);
    try {
      const result = await transferWalletPoints(recipient.trim(), numericAmount);
      setWallet(current => current ? { ...current, balance: result.balance } : current);
      setSheet(null);
      setRecipient('');
      setAmount('');
      setFeedback({ title: 'تم التحويل', message: `تم إرسال ${result.amount.toLocaleString('ar-EG')} EKN إلى ${result.recipient.name}.` });
      await load();
    } catch (error) {
      setFeedback({ title: 'تعذر التحويل', message: error instanceof Error ? error.message : 'تحقق من الرصيد والمعرف.' });
    } finally {
      setBusy(false);
    }
  };

  const submitDeposit = async () => {
    if (!depositCode.trim()) {
      setFeedback({ title: 'أدخل الكود', message: 'أدخل كود الإيداع لشحن رصيد EKN.' });
      return;
    }
    setBusy(true);
    try {
      const result = await depositWalletCode(depositCode.trim());
      setWallet(current => current ? { ...current, balance: result.balance } : current);
      setSheet(null);
      setDepositCode('');
      setFeedback({ title: 'تم الإيداع', message: `أضيفت ${result.points.toLocaleString('ar-EG')} EKN إلى محفظتك.` });
      await load();
    } catch (error) {
      setFeedback({ title: 'تعذر الإيداع', message: error instanceof Error ? error.message : 'تحقق من كود الإيداع.' });
    } finally {
      setBusy(false);
    }
  };

  const submitPurchase = async () => {
    if (!canPurchase) {
      setFeedback({ title: t('walletPurchasePlans'), message: t('walletInsufficientWithFee') });
      return;
    }
    setBusy(true);
    setPurchaseBalanceBefore(wallet?.balance ?? 0);
    try {
      const result = await purchaseSubscriptionWithWallet(purchasePlan, purchaseDuration);
      setWallet(current => current ? { ...current, balance: result.balance } : current);
      setSheet(null);
      setPurchaseResult(result);
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      setFeedback({
        title: t('walletPurchasePlans'),
        message: message.includes('كود اشتراك واحد') ? t('walletMonthlyLimit') : message.includes('رصيد EKN') ? t('walletInsufficientWithFee') : (message || t('tryAgain')),
      });
    } finally {
      setBusy(false);
    }
  };

  const receiptText = purchaseResult
    ? [
      t('walletPurchaseReceipt'),
      purchaseResult.plan === 'pro' ? t('walletPlanPro') : t('walletPlanProMax'),
      `${t('walletDuration')}: ${t('walletDays', { days: purchaseResult.durationDays })}`,
      t('walletTotalPrice', { price: purchaseResult.cost.toLocaleString('en-US') }),
      `${t('walletBalance')}: ${purchaseResult.balance.toLocaleString('en-US')} EKN`,
      `${t('walletActivationCode')}: ${purchaseResult.code}`,
      formatDate(purchaseResult.createdAt),
    ].join('\n')
    : '';

  const copyPurchaseCode = async () => {
    if (!purchaseResult) return;
    if (Platform.OS === 'web' && globalThis.navigator?.clipboard) {
      await globalThis.navigator.clipboard.writeText(purchaseResult.code);
      setFeedback({ title: t('walletCodeCopied'), message: purchaseResult.code });
      return;
    }
    await Clipboard.setStringAsync(purchaseResult.code);
    setFeedback({ title: t('walletCodeCopied'), message: purchaseResult.code });
  };

  const shareReceipt = async () => {
    if (!purchaseResult) return;
    if (Platform.OS === 'web' && globalThis.navigator?.clipboard) {
      await globalThis.navigator.clipboard.writeText(receiptText);
      setFeedback({ title: t('walletShareReceipt'), message: t('walletCodeCopied') });
      return;
    }
    await Share.share({ message: receiptText, title: t('walletPurchaseReceipt') });
  };

  const openTransaction = (transaction: WalletTransaction) => {
    const direction = transaction.direction === 'received' ? 'وارد' : transaction.direction === 'fee' ? 'رسوم' : 'صادر';
    setDetail(transaction);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top + 12 }]}>
      <TopBar title={t('walletTitle')} subtitle={t('walletProfileHint')} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: insets.bottom + 24 }}>
        {loading ? <ActivityIndicator color={colors.light.primary} style={styles.loader} /> : <>
          <GlowCard accent="purple" style={styles.balance}>
            <View style={styles.balanceTop}><Pressable onPress={() => setVisible(value => !value)}><Feather name={visible ? 'eye' : 'eye-off'} size={19} color="#cdbfff" /></Pressable><Pill tone="purple">EKN</Pill></View>
            <Text style={styles.balanceLabel}>{t('walletBalance')}</Text>
            <Text style={styles.balanceValue}>{visible ? (wallet?.balance ?? 0).toLocaleString('ar-EG') : '••••'} <Text style={styles.balanceUnit}>EKN</Text></Text>
            <View style={styles.balanceFooter}><Text style={styles.balanceHint}>آخر تحديث منذ لحظات</Text><Text style={styles.lmr}>{user?.userId ?? user?.username ?? '—'}</Text></View>
          </GlowCard>
          <View style={styles.quick}>
             <Quick icon="send" label={t('walletActionTransfer')} onPress={() => setSheet('transfer')} />
             <Quick icon="plus-circle" label={t('walletActionDeposit')} onPress={() => setSheet('deposit')} />
             <Quick icon="shopping-bag" label={t('walletPurchasePlans')} onPress={() => { setFormError(''); setSheet('purchase'); }} />
             <Quick icon="download" label={t('walletActionWithdraw')} onPress={() => setFeedback({ title: t('walletActionWithdraw'), message: t('walletWithdrawHint') })} />
          </View>
           <SectionLabel>{t('walletRecentTransactions')}</SectionLabel>
            {transactions.length === 0 ? <View style={styles.empty}><Feather name="inbox" size={25} color={colors.light.mutedForeground} /><Text style={styles.emptyText}>{t('walletNoTransactions')}</Text></View> : transactions.slice(0, 20).map(transaction => <Pressable key={transaction.id} onPress={() => openTransaction(transaction)} style={({ pressed }) => [styles.transaction, pressed && { opacity: 0.72 }]}><View style={[styles.txIcon, { backgroundColor: `${transaction.direction === 'received' ? '#55dfb0' : transaction.direction === 'fee' ? '#ff8292' : '#aa7cff'}22` }]}><Feather name={transaction.direction === 'received' ? 'arrow-down-left' : transaction.direction === 'fee' ? 'minus-circle' : 'send'} size={17} color={transaction.direction === 'received' ? '#55dfb0' : transaction.direction === 'fee' ? '#ff8292' : '#aa7cff'} /></View><View style={styles.txText}><Text style={styles.txTitle}>{transaction.type === 'subscription' ? t('walletSubscriptionEntry') : transaction.type === 'subscription_extension' ? t('walletSubscriptionExtensionEntry') : transaction.type === 'deposit' ? t('walletDepositEntry') : transaction.type === 'fee' ? t('walletFilterTransfer') : transaction.direction === 'received' ? t('walletReceivedFrom', { name: transaction.sender?.userId ?? transaction.sender?.username ?? '—' }) : t('walletSentTo', { name: transaction.recipient?.userId ?? transaction.recipient?.username ?? '—' })}</Text><Text style={styles.txDate}>{formatDate(transaction.createdAt)}</Text></View><Text style={[styles.txAmount, { color: transaction.direction === 'received' ? '#55dfb0' : colors.light.foreground }]}>{transaction.direction === 'received' ? '+' : '-'}{transaction.amount.toLocaleString('en-US')} EKN</Text></Pressable>)}
          <SectionLabel>إدارة المحفظة</SectionLabel>
           <ActionRow icon="file-text" title="كشوفات وإيصالات" description="اضغط على أي عملية لرؤية مرجعها وحالتها" onPress={() => transactions[0] ? openTransaction(transactions[0]) : setFeedback({ title: 'الإيصالات', message: 'لا توجد عمليات بعد.' })} />
           <ActionRow icon="shield" title="أمان المحفظة" description="التحويلات والإيداعات تسجل في سجل الحساب" onPress={() => setFeedback({ title: 'أمان المحفظة', message: 'كل عملية تُسجل برقم مرجعي وحالة واضحة في سجل المحفظة.' })} />
        </>}
      </ScrollView>
       <Modal visible={sheet === 'purchase'} transparent animationType="slide" onRequestClose={() => !busy && setSheet(null)}>
         <View style={styles.modalBackdrop}><View style={[styles.sheet, styles.purchaseSheet, { paddingBottom: insets.bottom + 18 }]}>
           <View style={styles.handle} />
           <Text style={styles.sheetTitle}>{t('walletPurchasePlans')}</Text>
           <Text style={styles.sheetDescription}>{t('walletPurchaseHint')}</Text>
           <Text style={styles.sheetDescription}>{t('walletMonthlyLimit')}</Text>
           <View style={styles.purchasePlanRow}>{purchasePlans.map(plan => <Pressable key={plan.id} onPress={() => setPurchasePlan(plan.id)} style={[styles.purchasePlan, purchasePlan === plan.id && styles.purchasePlanSelected]}><Text style={styles.purchasePlanTitle}>{t(plan.labelKey)}</Text><Text style={styles.purchasePlanPrice}>{t('walletMonthlyPrice', { price: plan.monthly.toLocaleString('en-US') })}</Text></Pressable>)}</View>
           <Text style={styles.purchaseLabel}>{t('walletDuration')}</Text>
           <View style={styles.durationRow}>{purchaseDurations.map(days => <Pressable key={days} onPress={() => setPurchaseDuration(days)} style={[styles.duration, purchaseDuration === days && styles.durationSelected]}><Text style={[styles.durationText, purchaseDuration === days && styles.durationTextSelected]}>{t('walletDays', { days })}</Text></Pressable>)}</View>
           <Text style={styles.purchaseTotal}>{t('walletTotalPrice', { price: purchaseCost.toLocaleString('en-US') })}</Text>
           <Text style={[styles.purchaseBalance, !canPurchase && styles.purchaseInsufficient]}>{t('walletBalance')}: {(wallet?.balance ?? 0).toLocaleString('en-US')} EKN</Text>
           <PrimaryButton onPress={() => void submitPurchase()} disabled={busy || !canPurchase}>{busy ? t('walletProcessing') : t('walletPurchaseConfirm')}</PrimaryButton>
           <Pressable onPress={() => setSheet(null)} disabled={busy} style={styles.closeSheet}><Text style={styles.closeText}>{t('walletClose')}</Text></Pressable>
         </View></View>
       </Modal>
       <Modal visible={Boolean(purchaseResult)} transparent animationType="fade" onRequestClose={() => setPurchaseResult(null)}>
         <View style={styles.modalBackdrop}><View style={[styles.sheet, styles.resultSheet, { paddingBottom: insets.bottom + 18 }]}>
           <View style={styles.handle} />
           <View style={styles.purchaseSuccessIcon}><Feather name="check" size={27} color="#fff" /></View>
           <Text style={styles.sheetTitle}>{t('walletPurchaseSuccess')}</Text>
           {purchaseResult && <><Text style={styles.codeLabel}>{t('walletActivationCode')}</Text><View style={styles.codeRow}><Text selectable style={styles.codeValue}>{purchaseResult.code}</Text><Pressable onPress={() => void copyPurchaseCode()} style={styles.copyButton}><Feather name="copy" size={16} color="#fff" /><Text style={styles.copyText}>{t('walletCopyCode')}</Text></Pressable></View><Text style={styles.sheetDescription}>{purchaseResult.plan === 'pro' ? t('walletPlanPro') : t('walletPlanProMax')} · {t('walletDays', { days: purchaseResult.durationDays })}</Text><Text style={styles.sheetDescription}>{t('walletTotalPrice', { price: purchaseResult.cost.toLocaleString('en-US') })}</Text><Text style={styles.sheetDescription}>{t('walletBalance')}: {purchaseBalanceBefore.toLocaleString('en-US')} → {purchaseResult.balance.toLocaleString('en-US')} EKN</Text></>}
           <View style={styles.resultActions}><PrimaryButton onPress={shareReceipt}>{t('walletShareReceipt')}</PrimaryButton><PrimaryButton secondary onPress={() => { setPurchaseResult(null); setSheet('purchase'); }}>{t('walletPurchaseAnother')}</PrimaryButton></View>
           <PrimaryButton secondary onPress={() => setPurchaseResult(null)}>{t('walletClose')}</PrimaryButton>
         </View></View>
       </Modal>
       <Modal visible={sheet === 'transfer' || sheet === 'deposit'} transparent animationType="slide" onRequestClose={() => setSheet(null)}>
         <View style={styles.modalBackdrop}><View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}><View style={styles.handle} /><Text style={styles.sheetTitle}>{sheet === 'transfer' ? 'تحويل EKN' : 'إيداع EKN'}</Text>{sheet === 'transfer' ? <><TextInput value={recipient} onChangeText={value => { setRecipient(value); setFormError(''); }} placeholder="LMR-12345678" placeholderTextColor={colors.light.mutedForeground} style={styles.sheetInput} autoCapitalize="characters" /><TextInput value={amount} onChangeText={value => { setAmount(value.replace(/\D/g, '')); setFormError(''); }} placeholder="المبلغ" placeholderTextColor={colors.light.mutedForeground} keyboardType="number-pad" style={styles.sheetInput} />{formError ? <Text style={styles.formError}>{formError}</Text> : null}<PrimaryButton onPress={() => void submitTransfer()} disabled={busy}>{busy ? 'جار التنفيذ...' : 'تأكيد التحويل'}</PrimaryButton></> : <><Text style={styles.sheetDescription}>أدخل كود الإيداع الذي حصلت عليه لشحن رصيد EKN.</Text><TextInput value={depositCode} onChangeText={value => { setDepositCode(value); setFormError(''); }} placeholder="كود الإيداع" placeholderTextColor={colors.light.mutedForeground} style={styles.sheetInput} autoCapitalize="characters" /><PrimaryButton onPress={() => void submitDeposit()} disabled={busy}>{busy ? 'جار التنفيذ...' : 'تأكيد الإيداع'}</PrimaryButton></>}<Pressable onPress={() => setSheet(null)} disabled={busy} style={styles.closeSheet}><Text style={styles.closeText}>إلغاء</Text></Pressable></View></View>
      </Modal>
      <Modal visible={Boolean(detail)} transparent animationType="slide" onRequestClose={() => setDetail(null)}>
        <View style={styles.modalBackdrop}><View style={[styles.sheet, { paddingBottom: insets.bottom + 18 }]}><View style={styles.handle} /><Text style={styles.sheetTitle}>تفاصيل العملية</Text>{detail && <><Text style={styles.sheetDescription}>{detail.direction === 'received' ? 'وارد' : detail.direction === 'fee' ? 'رسوم' : 'صادر'} · {detail.amount.toLocaleString('ar-EG')} EKN</Text><Text style={styles.sheetDescription}>الحالة: {detail.status === 'completed' ? 'مكتملة' : detail.status}</Text><Text style={styles.sheetDescription}>المرجع: {detail.referenceCode ?? `#${detail.id}`}</Text><Text style={styles.sheetDescription}>التاريخ: {new Date(detail.createdAt).toLocaleString('ar-EG')}</Text></>}<Pressable onPress={() => setDetail(null)} style={styles.closeSheet}><Text style={styles.closeText}>إغلاق</Text></Pressable></View></View>
      </Modal>
      {feedback && <FeedbackModal {...feedback} onClose={() => setFeedback(null)} />}
    </View>
  );
}

function Quick({ icon, label, onPress }: { icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.quickItem, pressed && { opacity: 0.7 }]}><View style={styles.quickIcon}><Feather name={icon} size={18} color={colors.light.primary} /></View><Text style={styles.quickLabel}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  formError: { color: '#ffadb8', textAlign: 'right', fontSize: 11 },
  screen: { flex: 1, backgroundColor: 'transparent' },
  loader: { marginTop: 60 },
  balance: { gap: 10, marginBottom: 12 },
  balanceTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { color: '#b3c7ef', fontSize: 11, textAlign: 'right' },
  balanceValue: { color: '#fff', fontSize: 35, fontWeight: '900', textAlign: 'right' },
  balanceUnit: { color: '#c6afff', fontSize: 13 },
  balanceFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  balanceHint: { color: '#9bace0', fontSize: 9 },
  lmr: { color: '#bfaeff', fontSize: 10, fontWeight: '800' },
  quick: { flexDirection: 'row-reverse', justifyContent: 'space-between', padding: 13, borderRadius: 18, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border },
  quickItem: { alignItems: 'center', gap: 7, minWidth: 58 },
  quickIcon: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#122850' },
  quickLabel: { color: colors.light.mutedForeground, fontSize: 10, fontWeight: '700' },
  transaction: { flexDirection: 'row-reverse', alignItems: 'center', gap: 11, padding: 13, marginBottom: 8, borderRadius: 15, backgroundColor: colors.light.card, borderWidth: 1, borderColor: colors.light.border },
  txIcon: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  txText: { flex: 1 },
  txTitle: { color: colors.light.foreground, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  txDate: { color: colors.light.mutedForeground, fontSize: 9, textAlign: 'right', marginTop: 3 },
  txAmount: { fontSize: 12, fontWeight: '800' },
  empty: { alignItems: 'center', gap: 8, padding: 26 },
  emptyText: { color: colors.light.mutedForeground, fontSize: 11 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,.65)' },
   sheet: { padding: 20, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#0d1733', borderWidth: 1, borderColor: colors.light.border, gap: 12 },
   purchaseSheet: { maxHeight: '92%' },
   resultSheet: { gap: 13 },
   purchasePlanRow: { flexDirection: 'row-reverse', gap: 8 },
   purchasePlan: { flex: 1, minHeight: 64, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderRadius: 13, backgroundColor: colors.light.background, borderWidth: 1, borderColor: colors.light.border },
   purchasePlanSelected: { backgroundColor: colors.light.primarySoft, borderColor: colors.light.primary },
   purchasePlanTitle: { color: colors.light.foreground, fontSize: 11, fontWeight: '800', textAlign: 'center' },
   purchasePlanPrice: { color: colors.light.mutedForeground, fontSize: 9, marginTop: 4, textAlign: 'center' },
   purchaseLabel: { color: colors.light.mutedForeground, fontSize: 11, textAlign: 'right' },
   durationRow: { flexDirection: 'row-reverse', gap: 8 },
   duration: { flex: 1, alignItems: 'center', paddingVertical: 11, borderRadius: 12, backgroundColor: colors.light.background, borderWidth: 1, borderColor: colors.light.border },
   durationSelected: { backgroundColor: colors.light.primarySoft, borderColor: colors.light.primary },
   durationText: { color: colors.light.mutedForeground, fontSize: 11, fontWeight: '700' },
   durationTextSelected: { color: '#fff' },
   purchaseTotal: { color: colors.light.accentForeground, fontSize: 15, fontWeight: '900', textAlign: 'right' },
   purchaseBalance: { color: colors.light.mutedForeground, fontSize: 11, textAlign: 'right' },
   purchaseInsufficient: { color: colors.light.destructive },
   purchaseSuccessIcon: { alignSelf: 'center', width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#159b72' },
   codeLabel: { color: colors.light.mutedForeground, fontSize: 10, textAlign: 'right' },
   codeRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, padding: 11, borderRadius: 13, backgroundColor: colors.light.background, borderWidth: 1, borderColor: colors.light.primary },
   codeValue: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 1, textAlign: 'center' },
   copyButton: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 8, borderRadius: 9, backgroundColor: colors.light.primary },
   copyText: { color: '#fff', fontSize: 10, fontWeight: '800' },
   resultActions: { gap: 8 },
  handle: { alignSelf: 'center', width: 42, height: 4, borderRadius: 2, backgroundColor: '#53658e', marginBottom: 7 },
  sheetTitle: { color: colors.light.foreground, fontSize: 19, fontWeight: '800', textAlign: 'right' },
  sheetDescription: { color: colors.light.mutedForeground, fontSize: 12, lineHeight: 20, textAlign: 'right' },
  sheetInput: { height: 51, borderRadius: 14, backgroundColor: colors.light.background, borderWidth: 1, borderColor: colors.light.border, color: colors.light.foreground, textAlign: 'right', paddingHorizontal: 14 },
  closeSheet: { alignItems: 'center', padding: 8 },
  closeText: { color: colors.light.mutedForeground, fontSize: 12 },
});
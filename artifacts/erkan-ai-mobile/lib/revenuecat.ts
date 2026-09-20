import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesOfferings, type PurchasesPackage } from 'react-native-purchases';
import { recordGooglePlayReceipt } from '@/lib/mobile-api';

const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;
const ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID || 'erkan_pro';
let configured = false;

export function isRevenueCatAvailable() {
  return Platform.OS === 'android' && Boolean(ANDROID_API_KEY);
}

export function initializeRevenueCat(appUserId?: string | null) {
  if (!isRevenueCatAvailable() || configured) return false;
  Purchases.configure({ apiKey: ANDROID_API_KEY!, appUserID: appUserId || undefined, store: 'PLAY_STORE' });
  configured = true;
  return true;
}

export async function getGooglePlayOfferings(appUserId?: string | null): Promise<PurchasesOfferings | null> {
  if (!isRevenueCatAvailable()) return null;
  initializeRevenueCat(appUserId);
  return (await Purchases.getOfferings()) || null;
}

function packageMatches(packageItem: PurchasesPackage, plan: 'pro' | 'pro_max', durationDays: 30 | 60 | 90) {
  const value = `${packageItem.identifier} ${packageItem.product.identifier}`.toLowerCase();
  const planMatches = plan === 'pro_max' ? value.includes('max') : !value.includes('max') && value.includes('pro');
  const durationMatches = durationDays === 30
    ? /month|monthly|30/.test(value)
    : durationDays === 60
      ? /2month|60/.test(value)
      : /3month|quarter|90/.test(value);
  return planMatches && durationMatches;
}

export async function purchaseGooglePlaySubscription(
  plan: 'pro' | 'pro_max',
  durationDays: 30 | 60 | 90,
  appUserId?: string | null,
) {
  const offerings = await getGooglePlayOfferings(appUserId);
  const packages = offerings?.current?.availablePackages ?? [];
  const packageToPurchase = packages.find(item => packageMatches(item, plan, durationDays))
    ?? packages.find(item => (plan === 'pro_max' ? item.identifier.toLowerCase().includes('max') : item.identifier.toLowerCase().includes('pro')));
  if (!packageToPurchase) throw new Error('لا توجد باقة Google Play متاحة لهذه الخطة والمدة.');

  const purchase = await Purchases.purchasePackage(packageToPurchase);
  const customerInfo: CustomerInfo = purchase.customerInfo;
  const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID] ?? Object.values(customerInfo.entitlements.active)[0];
  const transactionId = purchase.transaction?.transactionIdentifier || customerInfo.originalAppUserId;
  if (!transactionId) throw new Error('تعذر قراءة رقم معاملة Google Play.');
  await recordGooglePlayReceipt({
    productIdentifier: packageToPurchase.product.identifier,
    transactionId,
    entitlementIdentifier: entitlement?.identifier ?? ENTITLEMENT_ID,
    purchasedAt: purchase.transaction?.purchaseDate ?? new Date().toISOString(),
  });
  return { package: packageToPurchase, customerInfo, transactionId };
}
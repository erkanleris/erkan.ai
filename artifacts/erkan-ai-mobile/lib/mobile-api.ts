import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetch as expoFetch } from 'expo/fetch';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_ORIGIN = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}`
  : '';
export const AUTH_TOKEN_KEY = 'erkan_auth_token';
const LEGACY_AUTH_TOKEN_KEY = 'erkan_auth_token';

let authExpiredHandler: (() => void) | null = null;
let authInvalidationPromise: Promise<void> | null = null;
let accountRestrictionHandler: ((restriction: AccountRestriction) => void) | null = null;
let authTokenCache: string | null | undefined;
let authTokenRead: Promise<string | null> | null = null;
let authTokenWrite: Promise<void> = Promise.resolve();

export function setAuthExpiredHandler(handler: (() => void) | null) {
  authExpiredHandler = handler;
  return () => {
    if (authExpiredHandler === handler) authExpiredHandler = null;
  };
}

export type AccountRestriction = {
  code: 'ACCOUNT_BANNED';
  message: string;
  banReason: string | null;
  bannedUntil: string | null;
  supportInstagram: string;
};

export function setAccountRestrictionHandler(handler: ((restriction: AccountRestriction) => void) | null) {
  accountRestrictionHandler = handler;
  return () => {
    if (accountRestrictionHandler === handler) accountRestrictionHandler = null;
  };
}

async function readPersistedAuthToken(): Promise<string | null> {
  if (Platform.OS !== 'web') {
    const secureToken = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    if (secureToken) return secureToken;
  }

  // Migrate tokens created by older builds without leaving a bearer token in
  // the general-purpose AsyncStorage database.
  const legacyToken = await AsyncStorage.getItem(LEGACY_AUTH_TOKEN_KEY);
  if (!legacyToken) return null;
  if (Platform.OS !== 'web') await SecureStore.setItemAsync(AUTH_TOKEN_KEY, legacyToken);
  await AsyncStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
  return legacyToken;
}

export function getAuthToken(): Promise<string | null> {
  if (authTokenCache !== undefined) return Promise.resolve(authTokenCache);
  if (!authTokenRead) {
    authTokenRead = readPersistedAuthToken()
      .then(token => {
        // A login can finish while the initial storage read is still pending.
        // Never let that older read replace the in-memory login result.
        if (authTokenCache === undefined) authTokenCache = token;
        return authTokenCache;
      })
      .finally(() => {
        authTokenRead = null;
      });
  }
  return authTokenRead;
}

export async function storeAuthToken(token: string) {
  authTokenCache = token;
  const pendingRead = authTokenRead;
  const write = authTokenWrite.then(async () => {
    // Let an in-flight legacy migration finish first, then write the new
    // token last so a stale migration cannot overwrite it.
    if (pendingRead) await pendingRead;
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(LEGACY_AUTH_TOKEN_KEY, token);
    } else {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      await AsyncStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
    }
  });
  authTokenWrite = write.catch(() => undefined);
  await write;
}

export async function clearAuthToken() {
  authTokenCache = null;
  const pendingRead = authTokenRead;
  const write = authTokenWrite.then(async () => {
    if (pendingRead) await pendingRead;
    if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    await AsyncStorage.removeItem(LEGACY_AUTH_TOKEN_KEY);
  });
  authTokenWrite = write.catch(() => undefined);
  await write;
}

async function handleUnauthorized(failedToken: string | null) {
  if (!failedToken) return;
  const currentToken = await getAuthToken();
  if (currentToken !== failedToken) return;
  if (authInvalidationPromise) return authInvalidationPromise;

  authInvalidationPromise = (async () => {
    const latestToken = await getAuthToken();
    if (latestToken !== failedToken) return;
    await clearAuthToken();
    authExpiredHandler?.();
  })().finally(() => {
    authInvalidationPromise = null;
  });
  return authInvalidationPromise;
}

export type MobileUser = {
  id: number;
  userId: string | null;
  name: string;
  username: string;
  email: string;
  bio: string | null;
  gender: 'male' | 'female' | null;
  country: string | null;
  avatarUrl: string | null;
  subscriptionType: string;
  subscriptionExpiresAt: string | null;
  conversationCount: number;
  imageCount: number;
  activationCode: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  accountStatus?: 'active' | 'banned' | string;
  banReason?: string | null;
  bannedAt?: string | null;
  banUntil?: string | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
};

export type Conversation = {
  id: number;
  title: string;
  mode: string;
  updatedAt: string;
};

export type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

export type SubscriptionStatus = {
  plan: 'free' | 'pro' | 'pro_max' | string;
  expiresAt: string | null;
  dailyUsed: number;
  dailyLimit: number;
};

export type WalletSummary = {
  id: number;
  balance: number;
  updatedAt: string;
};

export type WalletPerson = {
  id: number;
  name: string;
  username: string;
  userId: string | null;
};

export type WalletTransaction = {
  id: number;
  type: 'transfer' | 'deposit' | 'fee' | 'subscription' | 'subscription_extension';
  amount: number;
  fee: number;
  status: string;
  senderId: number | null;
  recipientId: number;
  senderBalanceAfter: number | null;
  recipientBalanceAfter: number | null;
  referenceCode: string | null;
  createdAt: string;
  sender: WalletPerson | null;
  recipient: WalletPerson;
  direction: 'sent' | 'received' | 'fee';
};

export type WalletTransferResult = {
  success: boolean;
  status: string;
  transactionId: number;
  operationId: string;
  createdAt: string;
  senderBalanceBefore: number;
  balance: number;
  amount: number;
  fee: number;
  totalDebited: number;
  recipient: WalletPerson;
};

export type WalletSubscriptionPurchaseResult = {
  success: boolean;
  code: string;
  plan: 'pro' | 'pro_max';
  durationDays: 30 | 60 | 90;
  cost: number;
  balance: number;
  createdAt: string;
};

export type SubscriptionExtensionResult = {
  success: true;
  plan: 'pro' | 'pro_max';
  additionalDays: number;
  cost: number;
  balance: number;
  expiresAt: string;
};

export type SubscriptionCancelResult = {
  success: true;
  plan: 'free';
  expiresAt: null;
};

export type SubscriptionTransferResult = {
  success: true;
  plan: 'pro' | 'pro_max';
  expiresAt: string;
  recipient: {
    name: string;
    userId: string | null;
  };
};

export type GooglePlayReceipt = {
  productIdentifier: string;
  transactionId: string;
  entitlementIdentifier?: string | null;
  purchasedAt?: string | null;
};

export type PrivacySettings = {
  twoFactorEnabled: boolean;
  loginAlertsEnabled: boolean;
  dataRetentionDays: number;
};

export type SecurityEvent = {
  id: number;
  deviceName: string;
  browser: string;
  ipAddress: string | null;
  createdAt: string;
  readAt: string | null;
};

export type AuthSession = {
  id: number;
  deviceName: string;
  browser: string;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string;
  isCurrent: boolean;
};

function url(path: string) {
  return `${API_ORIGIN}${path}`;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url(path), { ...init, headers });
  const data = await response.json().catch(() => null);
  if (response.status === 401) await handleUnauthorized(token);
  if (response.status === 403 && data?.code === 'ACCOUNT_BANNED') {
    accountRestrictionHandler?.({
      code: 'ACCOUNT_BANNED',
      message: typeof data.error === 'string' ? data.error : 'تم حظر حسابك.',
      banReason: typeof data.banReason === 'string' ? data.banReason : null,
      bannedUntil: typeof data.bannedUntil === 'string' ? data.bannedUntil : null,
      supportInstagram: typeof data.supportInstagram === 'string' ? data.supportInstagram : '@erkan.ai',
    });
  }
  if (!response.ok) {
    const message = data && typeof data.error === 'string' ? data.error : 'تعذر الاتصال بالخدمة';
    const error = new Error(message) as Error & { code?: string };
    error.code = data && typeof data.code === 'string' ? data.code : undefined;
    throw error;
  }
  return data as T;
}

export async function login(email: string, password: string, twoFactorCode?: string) {
  const result = await request<{ token: string; user: MobileUser }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, twoFactorCode }),
  });
  await storeAuthToken(result.token);
  return result.user;
}

export async function register(name: string, email: string, password: string) {
  const result = await request<{ token: string; user: MobileUser }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, legalConsent: true }),
  });
  await storeAuthToken(result.token);
  return result.user;
}

export async function getMe() {
  return request<MobileUser>('/api/auth/me');
}

export async function updateProfile(data: Partial<Pick<MobileUser, 'name' | 'username' | 'bio' | 'avatarUrl' | 'gender' | 'country'>>) {
  return request<MobileUser>('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return request<{ success: true }>('/api/users/me/password', {
    method: 'PUT',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function deleteAccount() {
  const result = await request<{ success: true }>('/api/users/me', { method: 'DELETE' });
  await clearAuthToken();
  return result;
}

export async function getAuthSessions() {
  return request<AuthSession[]>('/api/auth/sessions');
}

export async function endAuthSession(sessionId: number) {
  const result = await request<{ success: true; current: boolean }>(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' });
  if (result.current) await clearAuthToken();
  return result;
}

export async function endOtherAuthSessions() {
  return request<{ success: true; revoked: number }>('/api/auth/sessions/others', { method: 'DELETE' });
}

export type ContentAdaptationReport = {
  dialect: string;
  adapted: { messages: number; titles: number };
  failed: { messages: number; titles: number };
  skipped: { messages: number; titles: number };
  batches: number;
};

export async function adaptSavedContent(maxBatches = 50, onBatch?: (report: ContentAdaptationReport) => void) {
  const report: ContentAdaptationReport = {
    dialect: '',
    adapted: { messages: 0, titles: 0 },
    failed: { messages: 0, titles: 0 },
    skipped: { messages: 0, titles: 0 },
    batches: 0,
  };
  for (let index = 0; index < maxBatches; index += 1) {
    const batch = await request<ContentAdaptationReport & { hasMore: boolean }>('/api/ai/adapt-content', { method: 'POST' });
    report.dialect = batch.dialect;
    report.batches += 1;
    for (const key of ['adapted', 'failed', 'skipped'] as const) {
      report[key].messages += batch[key].messages;
      report[key].titles += batch[key].titles;
    }
    onBatch?.(report);
    if (!batch.hasMore) return report;
  }
  return report;
}

export function getGoogleAuthUrl(redirectUri: string, legalConsent = false) {
  const params = new URLSearchParams({
    redirect_uri: redirectUri,
    ...(legalConsent ? { legal_consent: 'true' } : {}),
  });
  return url(`/api/auth/google?${params.toString()}`);
}

export async function exchangeGoogleHandoff(code: string, twoFactorCode?: string) {
  const result = await request<{ token: string; user: MobileUser }>('/api/auth/google/exchange', {
    method: 'POST',
    body: JSON.stringify({ code, twoFactorCode }),
  });
  await storeAuthToken(result.token);
  return result.user;
}

export async function logout() {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } catch {
    // Local logout must still complete when the network is unavailable.
  } finally {
    await clearAuthToken();
  }
}

export async function registerPushDevice(token: string) {
  return request<{ success: true }>('/api/notifications/devices', {
    method: 'POST',
    body: JSON.stringify({ token, platform: 'android' }),
  });
}

export async function unregisterPushDevice(token?: string) {
  return request<{ success: true }>('/api/notifications/devices', {
    method: 'DELETE',
    body: JSON.stringify(token ? { token } : {}),
  });
}

export async function getConversations() {
  return request<Conversation[]>('/api/ai/conversations');
}

export async function deleteConversation(conversationId: number) {
  return request(`/api/ai/conversations/${conversationId}`, { method: 'DELETE' });
}

export async function renameConversation(conversationId: number, title: string) {
  return request<Conversation>(`/api/ai/conversations/${conversationId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  });
}

export async function deleteAllConversations() {
  return request('/api/ai/conversations', { method: 'DELETE' });
}

export async function createConversation(title = 'محادثة جديدة', mode = 'default') {
  return request<Conversation>('/api/ai/conversations', {
    method: 'POST',
    body: JSON.stringify({ title, mode }),
  });
}

export async function getMessages(conversationId: number) {
  return request<Message[]>(`/api/ai/conversations/${conversationId}/messages`);
}

export async function generateImage(prompt: string) {
  return request<{ url: string }>('/api/ai/generate-image', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
}

export async function streamMessage(
  conversationId: number,
  content: string,
  onChunk: (chunk: string) => void,
  mode = 'default',
) {
  const token = await getAuthToken();
  const headers = new Headers({
    Accept: 'text/event-stream',
    'Content-Type': 'application/json',
  });
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await expoFetch(url(`/api/ai/conversations/${conversationId}/messages`), {
    method: 'POST',
    headers,
    body: JSON.stringify({ content, mode }),
  });
  if (response.status === 401) await handleUnauthorized(token);
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data && typeof data.error === 'string' ? data.error : 'تعذر الحصول على الرد');
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error('لا يمكن قراءة رد المساعد');

  const decoder = new TextDecoder();
  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6);
      if (payload === '[DONE]') continue;
      try {
        const parsed = JSON.parse(payload) as { content?: string; error?: string };
        if (parsed.error) throw new Error(parsed.error);
        if (parsed.content) onChunk(parsed.content);
      } catch (error) {
        if (error instanceof Error && error.message !== 'Unexpected end of JSON input') throw error;
      }
    }
  }
}

export async function getSubscriptionStatus() {
  return request<SubscriptionStatus>('/api/subscriptions/status');
}

export type InstagramFollowPrompt = {
  campaignKey: string;
  available: boolean;
  choice: 'follow' | 'decline' | null;
  chosenAt: string | null;
};

export async function getInstagramFollowPrompt() {
  return request<InstagramFollowPrompt>('/api/social/instagram-follow');
}

export async function recordInstagramFollowChoice(choice: 'follow' | 'decline') {
  return request<{ success: true; choice: 'follow' | 'decline'; chosenAt: string | null }>('/api/social/instagram-follow', {
    method: 'POST',
    body: JSON.stringify({ choice }),
  });
}

export async function extendSubscription(additionalDays: number) {
  return request<SubscriptionExtensionResult>('/api/subscriptions/extend', {
    method: 'POST',
    body: JSON.stringify({ additionalDays }),
  });
}

export async function cancelSubscription() {
  return request<SubscriptionCancelResult>('/api/subscriptions/cancel', { method: 'POST' });
}

export async function transferSubscription(recipientIdentifier: string) {
  return request<SubscriptionTransferResult>('/api/subscriptions/transfer', {
    method: 'POST',
    body: JSON.stringify({ recipientIdentifier }),
  });
}

export async function activateSubscriptionCode(code: string) {
  return request<{
    success: true;
    plan: string;
    planName: string;
    expiresAt: string;
    durationDays: number;
  }>('/api/subscriptions/activate', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function getWallet() {
  return request<WalletSummary>('/api/wallet');
}

export async function getWalletTransactions() {
  return request<WalletTransaction[]>('/api/wallet/transactions');
}

export async function transferWalletPoints(recipientIdentifier: string, amount: number) {
  return request<WalletTransferResult>('/api/wallet/transfer', {
    method: 'POST',
    body: JSON.stringify({ recipientIdentifier, amount }),
  });
}

export async function depositWalletCode(code: string) {
  return request<{ success: true; points: number; balance: number }>('/api/wallet/deposit', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export async function purchaseSubscriptionWithWallet(
  plan: 'pro' | 'pro_max',
  durationDays: 30 | 60 | 90,
) {
  return request<WalletSubscriptionPurchaseResult>('/api/wallet/purchase-subscription', {
    method: 'POST',
    body: JSON.stringify({ plan, durationDays }),
  });
}

export async function recordGooglePlayReceipt(receipt: GooglePlayReceipt) {
  return request<{ success: true; recorded: boolean; id?: number; transactionId: string; createdAt?: string }>(
    '/api/subscriptions/google-play/receipt',
    { method: 'POST', body: JSON.stringify(receipt) },
  );
}

export async function getPrivacySettings() {
  return request<PrivacySettings>('/api/privacy/settings');
}

export async function updatePrivacySettings(data: Partial<Pick<PrivacySettings, 'loginAlertsEnabled' | 'dataRetentionDays'>>) {
  return request<PrivacySettings>('/api/privacy/settings', { method: 'PATCH', body: JSON.stringify(data) });
}

export async function startTwoFactorSetup() {
  return request<{ secret: string; otpauthUri: string }>('/api/privacy/2fa/setup', { method: 'POST' });
}

export async function verifyTwoFactor(code: string) {
  return request<PrivacySettings>('/api/privacy/2fa/verify', { method: 'POST', body: JSON.stringify({ code }) });
}

export async function disableTwoFactor(code: string) {
  return request<PrivacySettings>('/api/privacy/2fa', { method: 'DELETE', body: JSON.stringify({ code }) });
}

export async function getSecurityEvents() {
  return request<SecurityEvent[]>('/api/privacy/events');
}

export async function deleteConversationHistory() {
  const result = await request<{ success: true; deleted: number }>('/api/privacy/conversations', { method: 'DELETE' });
  return result.deleted;
}

export async function exportPrivacyData() {
  return request<{
    exportedAt: string;
    account: Record<string, unknown>;
    conversations: unknown[];
    messages: unknown[];
    generatedImages: unknown[];
  }>('/api/privacy/export');
}

export type AdminDashboard = {
  users: number;
  activeSubscriptions: number;
  activeSessions: number;
  walletBalance: number;
};

export type AdminUser = MobileUser & {
  accountStatus: string;
  isVerified: boolean;
  verifiedAt: string | null;
  verifiedBy?: string | null;
  lastLoginAt: string | null;
};

export type AdminVerificationUser = Pick<AdminUser, 'id' | 'userId' | 'name' | 'username' | 'email' | 'avatarUrl' | 'subscriptionType' | 'createdAt' | 'lastLoginAt' | 'accountStatus' | 'isVerified' | 'verifiedAt' | 'verifiedBy'>;

export type AdminConversation = {
  id: number;
  title: string;
  mode: string;
  userId: number | null;
  userName: string | null;
  username: string | null;
  email: string | null;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
};

export type AdminConversationMessage = {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  originalContent: string | null;
  createdAt: string;
};

export type InstagramFollowStats = {
  campaignKey: string;
  totalUsers: number;
  totalResponses: number;
  pendingUsers: number;
  followed: number;
  declined: number;
  followPercent: number;
  declinePercent: number;
};

async function adminRequest<T>(adminKey: string, path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  headers.set('X-Admin-Key', adminKey);
  const token = await getAuthToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  const response = await fetch(url(path), { ...init, headers });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data && typeof data.error === 'string' ? data.error : 'تعذر تنفيذ إجراء الإدارة');
  }
  return data as T;
}

export async function adminGetDashboard(adminKey: string) {
  return adminRequest<AdminDashboard>(adminKey, '/api/admin/dashboard');
}

export async function adminGetUsers(adminKey: string, query = '') {
  const suffix = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
  return adminRequest<AdminUser[]>(adminKey, `/api/admin/users${suffix}`);
}

export async function adminGetVerifications(adminKey: string, query = '', status: 'all' | 'verified' | 'unverified' = 'all') {
  const params = new URLSearchParams();
  if (query.trim()) params.set('q', query.trim());
  if (status !== 'all') params.set('status', status);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return adminRequest<AdminVerificationUser[]>(adminKey, `/api/admin/verifications${suffix}`);
}

export async function adminVerifyUser(adminKey: string, id: number) {
  return adminRequest(adminKey, `/api/admin/users/${id}/verify`, { method: 'POST' });
}

export async function adminUnverifyUser(adminKey: string, id: number) {
  return adminRequest(adminKey, `/api/admin/users/${id}/unverify`, { method: 'POST' });
}

export async function adminBanUser(adminKey: string, id: number, reason: string, durationDays: number | null) {
  return adminRequest(adminKey, `/api/admin/users/${id}/ban`, {
    method: 'POST',
    body: JSON.stringify({ reason, durationDays }),
  });
}

export async function adminUnbanUser(adminKey: string, id: number) {
  return adminRequest(adminKey, `/api/admin/users/${id}/unban`, { method: 'POST' });
}

export async function adminGetConversations(adminKey: string, query = '') {
  const suffix = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
  return adminRequest<AdminConversation[]>(adminKey, `/api/admin/conversations${suffix}`);
}

export async function adminGetConversationMessages(adminKey: string, id: number) {
  return adminRequest<{ conversation: AdminConversation; messages: AdminConversationMessage[] }>(adminKey, `/api/admin/conversations/${id}/messages`);
}

export async function adminGetInstagramFollowStats(adminKey: string) {
  return adminRequest<InstagramFollowStats>(adminKey, '/api/admin/instagram-follow');
}
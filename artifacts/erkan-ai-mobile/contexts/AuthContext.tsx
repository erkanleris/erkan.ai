import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  clearAuthToken,
  exchangeGoogleHandoff,
  getAuthToken,
  getGoogleAuthUrl,
  getMe,
  login,
  logout,
  register,
  setAccountRestrictionHandler,
  setAuthExpiredHandler,
  type AccountRestriction,
  type MobileUser,
} from '@/lib/mobile-api';
import { registerForPushNotificationsAsync, unregisterForPushNotificationsAsync } from '@/lib/push-notifications';

type AuthContextValue = {
  user: MobileUser | null;
  loading: boolean;
  error: string | null;
  accountRestriction: AccountRestriction | null;
  requiresTwoFactor: boolean;
  googleTwoFactorPending: boolean;
  signIn: (email: string, password: string, twoFactorCode?: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signInWithGoogle: (legalConsent?: boolean) => Promise<void>;
  completeGoogleSignIn: (twoFactorCode: string) => Promise<void>;
  updateUser: (user: MobileUser) => void;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountRestriction, setAccountRestriction] = useState<AccountRestriction | null>(null);
  const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
  const [googleTwoFactorPending, setGoogleTwoFactorPending] = useState(false);
  const pendingGoogleHandoff = useRef<string | null>(null);
  const processedGoogleUrls = useRef(new Set<string>());
  const restoreSessionRef = useRef<Promise<void>>(Promise.resolve());

  const handleGoogleCallback = useCallback(async (callbackUrl: string) => {
    if (processedGoogleUrls.current.has(callbackUrl)) return;
    processedGoogleUrls.current.add(callbackUrl);

    const parsed = Linking.parse(callbackUrl);
    const queryParams = parsed.queryParams ?? {};
    const handoffValue = queryParams.google_auth;
    const errorValue = queryParams.google_error;
    const handoff = typeof handoffValue === 'string' ? handoffValue : null;
    const googleError = typeof errorValue === 'string' ? errorValue : null;

    if (googleError) {
      setError(googleError === 'legal_consent_required'
        ? 'يجب الموافقة على سياسة الخصوصية وشروط الاستخدام'
        : 'تعذر تسجيل الدخول عبر Google، حاول مرة أخرى');
      return;
    }
    if (!handoff) return;

    try {
      setError(null);
      const currentUser = await exchangeGoogleHandoff(handoff);
      pendingGoogleHandoff.current = null;
      setRequiresTwoFactor(false);
      setGoogleTwoFactorPending(false);
      setUser(currentUser);
    } catch (cause) {
      const authError = cause as Error & { code?: string };
      if (authError.code === 'TWO_FACTOR_REQUIRED') {
        pendingGoogleHandoff.current = handoff;
        setRequiresTwoFactor(true);
      }
      setError(authError.message || 'تعذر تسجيل الدخول عبر Google');
      throw cause;
    }
  }, []);

  useEffect(() => {
    let active = true;
    const restoreSession = async () => {
      const token = await getAuthToken();
      if (token) {
        try {
          const currentUser = await getMe();
          if (active && (await getAuthToken()) === token) setUser(currentUser);
        } catch {
          if ((await getAuthToken()) === token) await clearAuthToken();
        }
      }
      if (active) setLoading(false);
    };
    const restorePromise = restoreSession();
    restoreSessionRef.current = restorePromise;
    void restorePromise;

    const removeAuthExpiryHandler = setAuthExpiredHandler(() => {
      if (!active) return;
      void unregisterForPushNotificationsAsync();
      setUser(null);
      setRequiresTwoFactor(false);
      setGoogleTwoFactorPending(false);
      pendingGoogleHandoff.current = null;
      setError('انتهت جلسة الدخول، سجّل الدخول مرة أخرى');
    });
    const removeAccountRestrictionHandler = setAccountRestrictionHandler(restriction => {
      if (active) setAccountRestriction(restriction);
    });
    const subscription = Linking.addEventListener('url', ({ url: callbackUrl }) => {
      setLoading(true);
      void handleGoogleCallback(callbackUrl)
        .catch(() => undefined)
        .finally(() => { if (active) setLoading(false); });
    });
    void Linking.getInitialURL().then(callbackUrl => {
      if (!active || !callbackUrl) return;
      setLoading(true);
      return handleGoogleCallback(callbackUrl)
        .catch(() => undefined)
        .finally(() => { if (active) setLoading(false); });
    });

    return () => {
      active = false;
      removeAuthExpiryHandler();
      removeAccountRestrictionHandler();
      subscription.remove();
    };
  }, [handleGoogleCallback]);

  useEffect(() => {
    if (!user) return;
    if (user.accountStatus === 'banned') {
      setAccountRestriction({
        code: 'ACCOUNT_BANNED',
        message: `تم حظر حسابك${user.banReason ? ` بسبب: ${user.banReason}` : ''}.`,
        banReason: user.banReason ?? null,
        bannedUntil: user.banUntil ?? null,
        supportInstagram: '@erkan.ai',
      });
    } else {
      setAccountRestriction(null);
    }
    void registerForPushNotificationsAsync().catch(() => undefined);
  }, [user]);

  const signIn = async (email: string, password: string, twoFactorCode?: string) => {
    setError(null);
    setLoading(true);
    try {
      await restoreSessionRef.current;
      setUser(await login(email, password, twoFactorCode));
      setRequiresTwoFactor(false);
      setGoogleTwoFactorPending(false);
    } catch (cause) {
      const authError = cause as Error & { code?: string };
      if (authError.code === 'TWO_FACTOR_REQUIRED') {
        setRequiresTwoFactor(true);
        setGoogleTwoFactorPending(false);
      }
      const message = cause instanceof Error ? cause.message : 'تعذر تسجيل الدخول';
      setError(message);
      throw cause;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    setError(null);
    setRequiresTwoFactor(false);
    setGoogleTwoFactorPending(false);
    setLoading(true);
    try {
      await restoreSessionRef.current;
      setUser(await register(name, email, password));
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'تعذر إنشاء الحساب';
      setError(message);
      throw cause;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (legalConsent = false) => {
    setError(null);
    setRequiresTwoFactor(false);
    setGoogleTwoFactorPending(false);
    pendingGoogleHandoff.current = null;
    setLoading(true);
    try {
      const redirectUri = Linking.createURL('oauth');
      const result = await WebBrowser.openAuthSessionAsync(
        getGoogleAuthUrl(redirectUri, legalConsent),
        redirectUri,
      );
      if (result.type === 'success') await handleGoogleCallback(result.url);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'تعذر تسجيل الدخول عبر Google';
      setError(message);
      throw cause;
    } finally {
      setLoading(false);
    }
  };

  const completeGoogleSignIn = async (twoFactorCode: string) => {
    const handoff = pendingGoogleHandoff.current;
    if (!handoff) {
      setError('انتهت محاولة تسجيل Google، حاول مرة أخرى');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await restoreSessionRef.current;
      setUser(await exchangeGoogleHandoff(handoff, twoFactorCode));
      pendingGoogleHandoff.current = null;
      setRequiresTwoFactor(false);
      setGoogleTwoFactorPending(false);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'تعذر إكمال تسجيل الدخول';
      setError(message);
      throw cause;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await unregisterForPushNotificationsAsync();
      await logout();
    } finally {
      setUser(null);
      setAccountRestriction(null);
      setRequiresTwoFactor(false);
      setGoogleTwoFactorPending(false);
      pendingGoogleHandoff.current = null;
    }
  };

  const updateUser = (nextUser: MobileUser) => {
    setUser(nextUser);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      error,
      accountRestriction,
      requiresTwoFactor,
      googleTwoFactorPending,
      signIn,
      signUp,
      signInWithGoogle,
      completeGoogleSignIn,
      updateUser,
      signOut,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
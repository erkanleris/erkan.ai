import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { registerPushDevice, unregisterPushDevice } from '@/lib/mobile-api';

export const PUSH_CHANNEL_ID = 'erkan-alerts';
const PUSH_TOKEN_KEY = 'erkan-ai-expo-push-token';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function registerForPushNotificationsAsync() {
  if (Platform.OS !== 'android' || !Device.isDevice) return null;

  await Notifications.setNotificationChannelAsync(PUSH_CHANNEL_ID, {
    name: 'تنبيهات ERKAN AI',
    description: 'ردود المساعد، المحفظة، الاشتراكات وتنبيهات الأمان',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 150, 250],
    sound: 'default',
  });

  let permissions = await Notifications.getPermissionsAsync();
  if (permissions.status !== 'granted') {
    if (permissions.status !== 'undetermined') return null;
    permissions = await Notifications.requestPermissionsAsync();
  }
  if (permissions.status !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const expoToken = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : {});
  await registerPushDevice(expoToken.data);
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, expoToken.data);
  return expoToken.data;
}

export async function unregisterForPushNotificationsAsync() {
  const token = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
  try {
    if (token) await unregisterPushDevice(token);
  } catch {
    // The auth token may already be expired; local cleanup is still required.
  } finally {
    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
  }
}

export type PushNotificationData = {
  type?: string;
  conversationId?: string | number;
};

export function getPushNotificationRoute(data: PushNotificationData) {
  if (data.type === 'chat' && data.conversationId) {
    return { pathname: '/chat/[id]' as const, params: { id: String(data.conversationId) } };
  }
  if (data.type === 'wallet') return '/wallet' as const;
  if (data.type === 'subscription') return '/plans' as const;
  if (data.type === 'security') return '/privacy' as const;
  return '/notifications' as const;
}
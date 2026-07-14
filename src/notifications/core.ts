import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const CHANNEL_ID = 'reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unsupported';

/**
 * Le notifiche vengono programmate solo se il permesso e' gia' stato concesso
 * (ensureNotificationPermissions chiede il permesso solo la prima volta: se
 * l'utente lo nega, expo-notifications non lo richiede piu' automaticamente
 * e da quel momento le notifiche smettono silenziosamente di arrivare). Le
 * impostazioni Famiglia usano questo stato per mostrare all'utente se le
 * notifiche sono davvero attive e permettergli di riprovare o aprire le
 * impostazioni di sistema.
 */
export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  if (Platform.OS === 'web') return 'unsupported';
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return 'granted';
  if (current.canAskAgain === false) return 'denied';
  return 'undetermined';
}

export async function ensureChannel(channelName: string) {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: channelName,
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/**
 * Cancella solo le notifiche programmate con questo prefisso, cosi' i
 * promemoria di funzionalita' diverse (rifiuti, pulizia, ...) non si
 * cancellano a vicenda quando uno dei due viene risincronizzato.
 */
export async function cancelByPrefix(prefix: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(prefix))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier))
  );
}

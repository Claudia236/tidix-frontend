import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { TranslateFn } from '../i18n/I18nContext';
import type { Item } from '../types';
import { CHANNEL_ID, cancelByPrefix, ensureChannel, ensureNotificationPermissions } from './core';

const REMINDER_HOUR = 9;
const REMINDER_MINUTE = 0;
const PREFIX = 'expiry-reminder-';

/**
 * Riprogramma i promemoria scadenza da zero. Ogni prodotto in scadenza riceve
 * un promemoria singolo (non ricorrente) la mattina del giorno prima.
 */
export async function syncExpiryReminders(items: Item[], t: TranslateFn): Promise<void> {
  if (Platform.OS === 'web') return;

  const granted = await ensureNotificationPermissions();
  if (!granted) return;

  await ensureChannel(t('notif.channelName'));
  await cancelByPrefix(PREFIX);

  const now = new Date();

  for (const item of items) {
    if (!item.expirationDate) continue;

    const reminderDate = new Date(`${item.expirationDate}T00:00:00`);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(REMINDER_HOUR, REMINDER_MINUTE, 0, 0);

    if (reminderDate.getTime() <= now.getTime()) continue; // gia' scaduto, non ha senso schedularlo nel passato

    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}${item.id}`,
      content: {
        title: t('notif.expiryReminder.title'),
        body: t('notif.expiryReminder.body', { name: item.name }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
        channelId: CHANNEL_ID,
      },
    });
  }
}

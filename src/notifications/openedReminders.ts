import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { TranslateFn } from '../i18n/I18nContext';
import type { Item } from '../types';
import { CHANNEL_ID, cancelByPrefix, ensureChannel, ensureNotificationPermissions, getNotificationsEnabledPref } from './core';

const REMINDER_HOUR = 9;
const REMINDER_MINUTE = 0;
const PREFIX = 'opened-reminder-';

/**
 * Riprogramma i promemoria "prodotto aperto da N giorni" da zero. Solo i
 * prodotti aperti per cui l'utente ha attivato il promemoria (vedi popup in
 * ItemForm) ricevono una notifica singola (non ricorrente), dopo il numero
 * di giorni scelto dall'utente per quel prodotto (openedReminderDays).
 */
export async function syncOpenedReminders(items: Item[], t: TranslateFn): Promise<void> {
  if (Platform.OS === 'web') return;

  const granted = await ensureNotificationPermissions();
  if (!granted) return;
  if (!(await getNotificationsEnabledPref())) return;

  await ensureChannel(t('notif.channelName'));
  await cancelByPrefix(PREFIX);

  const now = new Date();

  for (const item of items) {
    if (!item.opened || !item.openedReminderEnabled || !item.openedDate) continue;

    const reminderDate = new Date(`${item.openedDate}T00:00:00`);
    reminderDate.setDate(reminderDate.getDate() + (item.openedReminderDays || 3));
    reminderDate.setHours(REMINDER_HOUR, REMINDER_MINUTE, 0, 0);

    if (reminderDate.getTime() <= now.getTime()) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}${item.id}`,
      content: {
        title: t('notif.openedReminder.title'),
        body: t('notif.openedReminder.body', { name: item.name, days: item.openedReminderDays || 3 }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
        channelId: CHANNEL_ID,
      },
    });
  }
}

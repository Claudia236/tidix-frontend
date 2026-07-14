import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { TranslateFn } from '../i18n/I18nContext';
import type { CleaningTask } from '../types';
import { CHANNEL_ID, cancelByPrefix, ensureChannel, ensureNotificationPermissions, getNotificationsEnabledPref } from './core';

const REMINDER_HOUR = 20;
const REMINDER_MINUTE = 0;
const PREFIX = 'cleaning-reminder-';

/**
 * Riprogramma i promemoria pulizia da zero. A differenza dei rifiuti (giorni
 * fissi ogni settimana), qui la scadenza si sposta ogni volta che il task
 * viene segnato come pulito, quindi ogni promemoria e' una notifica singola
 * (non ricorrente) per la sera prima della prossima scadenza calcolata.
 */
export async function syncCleaningReminders(tasks: CleaningTask[], t: TranslateFn): Promise<void> {
  if (Platform.OS === 'web') return;

  const granted = await ensureNotificationPermissions();
  if (!granted) return;
  if (!(await getNotificationsEnabledPref())) return;

  await ensureChannel(t('notif.channelName'));
  await cancelByPrefix(PREFIX);

  const now = new Date();

  for (const task of tasks) {
    if (!task.frequencyDays || !task.lastCleanedDate) continue;

    const dueDate = new Date(`${task.lastCleanedDate}T00:00:00`);
    dueDate.setDate(dueDate.getDate() + task.frequencyDays);

    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(REMINDER_HOUR, REMINDER_MINUTE, 0, 0);

    if (reminderDate.getTime() <= now.getTime()) continue; // gia' scaduto, non ha senso schedularlo nel passato

    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}${task.id}`,
      content: {
        title: t('notif.cleaningReminder.title'),
        body: t('notif.cleaningReminder.body', { name: task.name }),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
        channelId: CHANNEL_ID,
      },
    });
  }
}

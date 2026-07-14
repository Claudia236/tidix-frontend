import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { dayToJsWeekday } from '../constants/domain';
import type { TranslateFn } from '../i18n/I18nContext';
import type { WasteSchedule } from '../types';
import { CHANNEL_ID, cancelByPrefix, ensureChannel, ensureNotificationPermissions, getNotificationsEnabledPref } from './core';

const REMINDER_HOUR = 20;
const REMINDER_MINUTE = 0;
const PREFIX = 'waste-reminder-';

// expo-notifications usa la convenzione 1 = domenica ... 7 = sabato per i trigger settimanali
function toTriggerWeekday(jsWeekday: number): number {
  return jsWeekday + 1;
}

/**
 * Riprogramma tutti i promemoria rifiuti da zero in base al calendario corrente.
 * Il promemoria arriva la sera del giorno prima della raccolta.
 * Non tocca il web: li' non esiste uno scheduler persistente affidabile,
 * il promemoria e' invece un banner mostrato in app (vedi wasteTypesCollectedOn).
 */
export async function syncWasteReminders(schedules: WasteSchedule[], t: TranslateFn): Promise<void> {
  if (Platform.OS === 'web') return;

  const granted = await ensureNotificationPermissions();
  if (!granted) return;
  if (!(await getNotificationsEnabledPref())) return;

  await ensureChannel(t('notif.channelName'));
  await cancelByPrefix(PREFIX);

  for (const schedule of schedules) {
    for (const day of schedule.daysOfWeek) {
      const collectionJsWeekday = dayToJsWeekday(day);
      const reminderJsWeekday = (collectionJsWeekday + 6) % 7; // il giorno prima

      await Notifications.scheduleNotificationAsync({
        identifier: `${PREFIX}${schedule.type}-${day}`,
        content: {
          title: t('notif.wasteReminder.title'),
          body: t('notif.wasteReminder.body', { type: t(`wasteNotif.${schedule.type}`) }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: toTriggerWeekday(reminderJsWeekday),
          hour: REMINDER_HOUR,
          minute: REMINDER_MINUTE,
          channelId: CHANNEL_ID,
        },
      });
    }
  }
}

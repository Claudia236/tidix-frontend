import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { dayToJsWeekday, wasteTypeInfo } from '../constants/domain';
import type { WasteSchedule } from '../types';

const REMINDER_HOUR = 20;
const REMINDER_MINUTE = 0;
const CHANNEL_ID = 'waste-reminders';

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

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Promemoria raccolta rifiuti',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

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
export async function syncWasteReminders(schedules: WasteSchedule[]): Promise<void> {
  if (Platform.OS === 'web') return;

  const granted = await ensureNotificationPermissions();
  if (!granted) return;

  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const schedule of schedules) {
    const info = wasteTypeInfo(schedule.type);
    for (const day of schedule.daysOfWeek) {
      const collectionJsWeekday = dayToJsWeekday(day);
      const reminderJsWeekday = (collectionJsWeekday + 6) % 7; // il giorno prima

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Promemoria raccolta rifiuti',
          body: `Domani passa ${info.label.toLowerCase()}: metti fuori il secchio stasera.`,
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

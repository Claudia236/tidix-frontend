import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { TranslateFn } from '../i18n/I18nContext';
import type { Plant } from '../types';
import { CHANNEL_ID, cancelByPrefix, ensureChannel, ensureNotificationPermissions, getNotificationsEnabledPref } from './core';

const REMINDER_HOUR = 18;
const REMINDER_MINUTE = 0;
const PREFIX = 'plant-reminder-';

/**
 * Stesso meccanismo di cancelCleaningReminder: cancella subito il promemoria
 * (programmato o gia' recapitato in tendina) di una singola pianta, senza
 * aspettare il refetch/resync completo.
 */
export async function cancelPlantReminder(plantId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  const identifier = `${PREFIX}${plantId}`;
  await Notifications.cancelScheduledNotificationAsync(identifier).catch(() => {});
  await Notifications.dismissNotificationAsync(identifier).catch(() => {});
}

export async function syncPlantReminders(plants: Plant[], t: TranslateFn): Promise<void> {
  if (Platform.OS === 'web') return;

  const granted = await ensureNotificationPermissions();
  if (!granted) return;
  if (!(await getNotificationsEnabledPref())) return;

  await ensureChannel(t('notif.channelName'));
  await cancelByPrefix(PREFIX);

  const now = new Date();

  for (const plant of plants) {
    if (!plant.wateringFrequencyDays || !plant.lastWateredDate) continue;

    const dueDate = new Date(`${plant.lastWateredDate}T00:00:00`);
    dueDate.setDate(dueDate.getDate() + plant.wateringFrequencyDays);

    const reminderDate = new Date(dueDate);
    reminderDate.setHours(REMINDER_HOUR, REMINDER_MINUTE, 0, 0);

    if (reminderDate.getTime() <= now.getTime()) continue; // gia' scaduto, non ha senso schedularlo nel passato

    // Un fallimento su una singola pianta non deve impedire di programmare i
    // promemoria per tutte le altre del ciclo (stesso motivo gia' in
    // syncCleaningReminders).
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `${PREFIX}${plant.id}`,
        content: {
          title: t('notif.plantReminder.title'),
          body: t('notif.plantReminder.body', { name: plant.name }),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderDate,
          channelId: CHANNEL_ID,
        },
      });
    } catch {
      // best-effort: si prosegue con le altre piante
    }
  }
}

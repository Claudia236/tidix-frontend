import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { DAY_ORDER_FROM_SUNDAY, dayToJsWeekday, wasteTypesCollectedOn, wasteTypesLabel } from '../constants/domain';
import type { TranslateFn } from '../i18n/I18nContext';
import type { Language } from '../i18n/translations';
import type { WasteSchedule } from '../types';
import { CHANNEL_ID, cancelByPrefix, ensureChannel, ensureNotificationPermissions, getNotificationsEnabledPref } from './core';

const REMINDER_HOUR = 20;
const REMINDER_MINUTE = 30;
const PREFIX = 'waste-reminder-';

// expo-notifications usa la convenzione 1 = domenica ... 7 = sabato per i trigger settimanali
function toTriggerWeekday(jsWeekday: number): number {
  return jsWeekday + 1;
}

/**
 * Riprogramma tutti i promemoria rifiuti da zero in base al calendario corrente.
 * La notifica arriva la sera del giorno prima della raccolta, alle 20:30: un
 * banner nella Panoramica (vedi wasteTypesCollectedOn) compare gia' dalle 20:00
 * come primo promemoria visivo, la notifica push e' il secondo avviso 30 minuti
 * dopo per chi non ha ancora aperto l'app.
 * Non tocca il web: li' non esiste uno scheduler persistente affidabile.
 *
 * Una sola notifica per giorno di raccolta, anche quando piu' tipi di
 * rifiuto sono raccolti lo stesso giorno (altrimenti ne arriverebbero due
 * separate, una per tipo, alla stessa ora): il testo elenca tutti i tipi
 * insieme con lo stesso identico testo del banner in Panoramica
 * (overview.wasteTomorrow + wasteTypesLabel), cosi' i due non possono
 * disallinearsi.
 */
export async function syncWasteReminders(schedules: WasteSchedule[], t: TranslateFn, language: Language): Promise<void> {
  if (Platform.OS === 'web') return;

  const granted = await ensureNotificationPermissions();
  if (!granted) return;
  if (!(await getNotificationsEnabledPref())) return;

  await ensureChannel(t('notif.channelName'));
  await cancelByPrefix(PREFIX);

  for (const day of DAY_ORDER_FROM_SUNDAY) {
    const types = wasteTypesCollectedOn(schedules, day);
    if (types.length === 0) continue;

    const collectionJsWeekday = dayToJsWeekday(day);
    const reminderJsWeekday = (collectionJsWeekday + 6) % 7; // il giorno prima

    await Notifications.scheduleNotificationAsync({
      identifier: `${PREFIX}${day}`,
      content: {
        title: t('notif.wasteReminder.title'),
        body: t('overview.wasteTomorrow', { types: wasteTypesLabel(types, t, language) }),
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

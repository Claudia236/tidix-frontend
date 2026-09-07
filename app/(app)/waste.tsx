import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getErrorMessage } from '../../src/api/client';
import { wasteApi } from '../../src/api/waste';
import { showAlert } from '../../src/components/AppAlert';
import { useDaysOfWeek, useWasteTypes } from '../../src/constants/domain';
import { useI18n } from '../../src/i18n/I18nContext';
import { syncWasteReminders } from '../../src/notifications/wasteReminders';
import type { ColorPalette } from '../../src/theme/colors';
import { useTheme } from '../../src/theme/ThemeContext';
import { webCentered } from '../../src/theme/responsive';
import type { DayOfWeek, WasteSchedule, WasteType } from '../../src/types';

export default function WasteScreen() {
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const wasteTypes = useWasteTypes();
  const daysOfWeek = useDaysOfWeek();
  const schedulesQuery = useQuery({ queryKey: ['waste-schedules'], queryFn: wasteApi.list });

  const daysByType = useMemo(() => {
    const map = new Map<WasteType, DayOfWeek[]>();
    (schedulesQuery.data ?? []).forEach((s) => map.set(s.type, s.daysOfWeek));
    return map;
  }, [schedulesQuery.data]);

  useEffect(() => {
    if (Platform.OS === 'web' || !schedulesQuery.data) return;
    syncWasteReminders(schedulesQuery.data, t, language);
  }, [schedulesQuery.data, t, language]);

  const toggleMutation = useMutation({
    mutationFn: ({ type, daysOfWeek }: { type: WasteType; daysOfWeek: DayOfWeek[] }) =>
      daysOfWeek.length > 0 ? wasteApi.setSchedule(type, daysOfWeek) : wasteApi.remove(type),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waste-schedules'] }),
    onError: (e) => showAlert(t('waste.errorTitle'), getErrorMessage(e, t)),
  });

  // Una richiesta di rete in coda per ciascun tipo di rifiuto: senza questo,
  // due tap rapidi sullo stesso tipo partivano in parallelo, e se le
  // risposte arrivavano fuori ordine lo stato salvato sul server poteva non
  // corrispondere all'ultimo tap (anche se la cache locale, aggiornata in
  // modo sincrono qui sotto, mostrava gia' il valore giusto).
  const pendingByType = useRef<Partial<Record<WasteType, Promise<unknown>>>>({});

  // Legge e aggiorna la cache di react-query in modo sincrono (non lo stato
  // derivato daysByType, che si aggiorna solo al prossimo render): due tap
  // rapidi su giorni diversi dello stesso tipo altrimenti leggerebbero
  // entrambi lo stesso "current" precedente al primo tap, perdendolo.
  function toggleDay(type: WasteType, day: DayOfWeek) {
    // Se la prima fetch e' ancora in corso, il suo arrivo sovrascriverebbe
    // subito dopo lo stato ottimistico scritto qui sotto (col dato server
    // precedente al tap), facendo lampeggiare il chip appena spuntato.
    if (schedulesQuery.isLoading) return;
    const list = queryClient.getQueryData<WasteSchedule[]>(['waste-schedules']) ?? [];
    const existing = list.find((s) => s.type === type);
    const current = existing?.daysOfWeek ?? [];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];

    const others = list.filter((s) => s.type !== type);
    const updated = next.length > 0 ? [...others, { id: existing?.id ?? type, type, daysOfWeek: next }] : others;
    queryClient.setQueryData(['waste-schedules'], updated);

    const previous = pendingByType.current[type] ?? Promise.resolve();
    const request = previous.catch(() => {}).then(() => toggleMutation.mutateAsync({ type, daysOfWeek: next }));
    pendingByType.current[type] = request;
    request.catch(() => {});
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, webCentered, { paddingBottom: 60 + insets.bottom }]}
    >
      <Text style={styles.intro}>{t('waste.intro')}</Text>

      {wasteTypes.map((w) => {
        const selectedDays = daysByType.get(w.key) ?? [];
        return (
          <View key={w.key} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={{ fontSize: 18 }}>{w.emoji}</Text>
              <Text style={styles.cardTitle}>{w.label}</Text>
            </View>
            <View style={styles.dayRow}>
              {daysOfWeek.map((d) => {
                const active = selectedDays.includes(d.key);
                return (
                  <Pressable
                    key={d.key}
                    onPress={() => toggleDay(w.key, d.key)}
                    disabled={schedulesQuery.isLoading}
                    style={[styles.dayChip, active && styles.dayChipActive, schedulesQuery.isLoading && styles.dayChipDisabled]}
                  >
                    <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>{d.short}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    content: { padding: 20, gap: 12, paddingBottom: 60 },
    intro: { fontSize: 13, color: COLORS.inkSoft, lineHeight: 18, marginBottom: 4 },
    card: {
      backgroundColor: COLORS.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.line,
      padding: 14,
      gap: 10,
    },
    cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
    dayRow: { flexDirection: 'row', gap: 6 },
    dayChip: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card,
      borderRadius: 8,
      paddingVertical: 8,
    },
    dayChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
    dayChipDisabled: { opacity: 0.5 },
    dayChipText: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
    dayChipTextActive: { color: COLORS.white },
  });
}

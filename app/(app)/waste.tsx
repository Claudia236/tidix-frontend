import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getErrorMessage } from '../../src/api/client';
import { wasteApi } from '../../src/api/waste';
import { showAlert } from '../../src/components/AppAlert';
import { useDaysOfWeek, useWasteTypes } from '../../src/constants/domain';
import { useI18n } from '../../src/i18n/I18nContext';
import { syncWasteReminders } from '../../src/notifications/wasteReminders';
import type { ColorPalette } from '../../src/theme/colors';
import { useTheme } from '../../src/theme/ThemeContext';
import { webCentered } from '../../src/theme/responsive';
import type { DayOfWeek, WasteType } from '../../src/types';

export default function WasteScreen() {
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
    syncWasteReminders(schedulesQuery.data, t);
  }, [schedulesQuery.data, t]);

  const toggleMutation = useMutation({
    mutationFn: ({ type, daysOfWeek }: { type: WasteType; daysOfWeek: DayOfWeek[] }) =>
      daysOfWeek.length > 0 ? wasteApi.setSchedule(type, daysOfWeek) : wasteApi.remove(type),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waste-schedules'] }),
    onError: (e) => showAlert(t('waste.errorTitle'), getErrorMessage(e, t)),
  });

  function toggleDay(type: WasteType, day: DayOfWeek) {
    const current = daysByType.get(type) ?? [];
    const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
    toggleMutation.mutate({ type, daysOfWeek: next });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, webCentered]}>
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
                    style={[styles.dayChip, active && styles.dayChipActive]}
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
    dayChipText: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
    dayChipTextActive: { color: COLORS.white },
  });
}

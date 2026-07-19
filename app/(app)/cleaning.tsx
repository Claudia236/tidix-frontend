import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cleaningApi } from '../../src/api/cleaning';
import { getErrorMessage } from '../../src/api/client';
import { showAlert } from '../../src/components/AppAlert';
import { AddFab } from '../../src/components/AddFab';
import { EmptyState } from '../../src/components/EmptyState';
import { useI18n } from '../../src/i18n/I18nContext';
import { syncCleaningReminders } from '../../src/notifications/cleaningReminders';
import type { ColorPalette } from '../../src/theme/colors';
import { useTheme } from '../../src/theme/ThemeContext';
import { webCentered } from '../../src/theme/responsive';
import type { CleaningTask } from '../../src/types';

export default function CleaningScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const tasksQuery = useQuery({ queryKey: ['cleaning-tasks'], queryFn: cleaningApi.list });

  useEffect(() => {
    if (Platform.OS === 'web' || !tasksQuery.data) return;
    syncCleaningReminders(tasksQuery.data, t);
  }, [tasksQuery.data, t]);

  const markCleanedMutation = useMutation({
    mutationFn: (id: string) => cleaningApi.markCleaned(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cleaning-tasks'] }),
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => cleaningApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cleaning-tasks'] }),
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  function confirmDelete(task: CleaningTask) {
    showAlert(t('cleaning.confirmDeleteTitle'), t('cleaning.confirmDeleteMessage', { name: task.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeMutation.mutate(task.id) },
    ]);
  }

  const tasks = useMemo(() => {
    const all = tasksQuery.data ?? [];
    if (!search.trim()) return all;
    const q = search.trim().toLowerCase();
    return all.filter((task) => task.name.toLowerCase().includes(q));
  }, [tasksQuery.data, search]);

  return (
    <View style={styles.container}>
      <View style={[styles.topSection, webCentered]}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.inkSoft} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('cleaning.searchPlaceholder')}
            placeholderTextColor={colors.inkSoft}
            style={styles.searchInput}
          />
        </View>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(task) => task.id}
        contentContainerStyle={[styles.list, webCentered, { paddingBottom: 20 + insets.bottom }]}
        ListEmptyComponent={
          <EmptyState
            icon="sparkles-outline"
            title={t('cleaning.emptyTitle')}
            subtitle={t('cleaning.emptySubtitle')}
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, item.overdue && styles.cardOverdue]}>
            <Pressable style={styles.cardInfo} onPress={() => router.push({ pathname: '/(app)/cleaning-task/[id]', params: { id: item.id } })}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardStatus}>
                {item.daysSinceCleaned === null
                  ? t('cleaning.neverCleaned')
                  : item.daysSinceCleaned === 0
                    ? t('cleaning.cleanedToday')
                    : t('cleaning.cleanedDaysAgo', { n: item.daysSinceCleaned })}
                {item.frequencyDays ? t('cleaning.everyDaysSuffix', { n: item.frequencyDays }) : ''}
              </Text>
              {item.overdue ? <Text style={styles.overdueLabel}>{t('cleaning.overdue')}</Text> : null}
            </Pressable>
            <View style={styles.cardActions}>
              <Pressable onPress={() => markCleanedMutation.mutate(item.id)} style={styles.cleanButton} hitSlop={8}>
                <Ionicons name="checkmark" size={16} color={colors.white} />
              </Pressable>
              <Pressable onPress={() => router.push({ pathname: '/(app)/cleaning-task/[id]', params: { id: item.id } })} hitSlop={8}>
                <Ionicons name="pencil-outline" size={18} color={colors.inkSoft} />
              </Pressable>
              <Pressable onPress={() => confirmDelete(item)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={colors.inkSoft} />
              </Pressable>
            </View>
          </View>
        )}
      />

      <AddFab onPress={() => router.push('/(app)/cleaning-task/new')} bottom={24 + insets.bottom} />
    </View>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg, paddingTop: 16 },
    topSection: { paddingHorizontal: 20, gap: 12 },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    searchInput: { flex: 1, fontSize: 14, color: COLORS.ink },
    list: { padding: 20, paddingTop: 16, gap: 10 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: COLORS.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.line,
      padding: 14,
    },
    cardOverdue: { borderColor: COLORS.danger },
    cardInfo: { flex: 1, gap: 2 },
    cardName: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
    cardStatus: { fontSize: 12, color: COLORS.inkSoft },
    overdueLabel: { fontSize: 11, fontWeight: '700', color: COLORS.danger, marginTop: 2 },
    cardActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    cleanButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: COLORS.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

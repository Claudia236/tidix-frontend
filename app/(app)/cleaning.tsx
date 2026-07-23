import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

type CleaningGroup = 'toClean' | 'done';
type CleaningRow =
  | { key: string; type: 'header'; group: CleaningGroup; count: number }
  | { key: string; type: 'item'; data: CleaningTask };

export default function CleaningScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<CleaningGroup>>(() => new Set(['done']));
  const tasksQuery = useQuery({ queryKey: ['cleaning-tasks'], queryFn: cleaningApi.list });

  // Ogni volta che si entra nella schermata, la sezione "Pulite" riparte
  // sempre chiusa (indipendentemente da come era stata lasciata l'ultima
  // volta), mentre "Da pulire" resta aperta.
  useFocusEffect(
    useCallback(() => {
      setCollapsedGroups(new Set(['done']));
    }, [])
  );

  function toggleGroupCollapsed(group: CleaningGroup) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

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
    const q = search.trim().toLowerCase();
    const filtered = q ? all.filter((task) => task.name.toLowerCase().includes(q)) : all;
    return [...filtered].sort((a, b) => {
      if (a.daysSinceCleaned === null && b.daysSinceCleaned === null) return 0;
      if (a.daysSinceCleaned === null) return -1;
      if (b.daysSinceCleaned === null) return 1;
      return b.daysSinceCleaned - a.daysSinceCleaned;
    });
  }, [tasksQuery.data, search]);

  const isSearching = search.trim().length > 0;

  const rows: CleaningRow[] = useMemo(() => {
    const toClean = tasks.filter((task) => task.overdue);
    const done = tasks.filter((task) => !task.overdue);
    const result: CleaningRow[] = [];
    if (toClean.length > 0) {
      result.push({ key: 'header-toClean', type: 'header', group: 'toClean', count: toClean.length });
      if (isSearching || !collapsedGroups.has('toClean')) {
        result.push(...toClean.map((task) => ({ key: `item-${task.id}`, type: 'item' as const, data: task })));
      }
    }
    if (done.length > 0) {
      result.push({ key: 'header-done', type: 'header', group: 'done', count: done.length });
      if (isSearching || !collapsedGroups.has('done')) {
        result.push(...done.map((task) => ({ key: `item-${task.id}`, type: 'item' as const, data: task })));
      }
    }
    return result;
  }, [tasks, collapsedGroups, isSearching]);

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
        data={rows}
        keyExtractor={(row) => row.key}
        contentContainerStyle={[styles.list, webCentered, { paddingBottom: 20 + insets.bottom }]}
        ListEmptyComponent={
          <EmptyState
            icon="sparkles-outline"
            title={t('cleaning.emptyTitle')}
            subtitle={t('cleaning.emptySubtitle')}
          />
        }
        renderItem={({ item: row }) => {
          if (row.type === 'header') {
            const collapsed = !isSearching && collapsedGroups.has(row.group);
            return (
              <Pressable style={styles.groupHeader} onPress={() => toggleGroupCollapsed(row.group)}>
                <Text style={styles.groupHeaderText}>
                  {t(row.group === 'toClean' ? 'cleaning.toCleanSection' : 'cleaning.doneSection')} ({row.count})
                </Text>
                <Ionicons name={collapsed ? 'chevron-down' : 'chevron-up'} size={16} color={colors.inkSoft} />
              </Pressable>
            );
          }

          const item = row.data;
          return (
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
          );
        }}
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
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 6,
      marginBottom: 2,
      paddingVertical: 2,
    },
    groupHeaderText: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: COLORS.inkSoft,
    },
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

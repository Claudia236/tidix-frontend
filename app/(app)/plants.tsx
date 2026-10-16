import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { plantsApi } from '../../src/api/plants';
import { getErrorMessage } from '../../src/api/client';
import { showAlert } from '../../src/components/AppAlert';
import { AddFab } from '../../src/components/AddFab';
import { EmptyState } from '../../src/components/EmptyState';
import { deleteAction, SwipeableRow } from '../../src/components/SwipeableRow';
import { useSyncQueue } from '../../src/hooks/useSyncQueue';
import { useI18n } from '../../src/i18n/I18nContext';
import { cancelPlantReminder, syncPlantReminders } from '../../src/notifications/plantReminders';
import type { ColorPalette } from '../../src/theme/colors';
import { useTheme } from '../../src/theme/ThemeContext';
import { webCentered } from '../../src/theme/responsive';
import type { Plant } from '../../src/types';

type PlantGroup = 'toWater' | 'done';
type PlantRow =
  | { key: string; type: 'header'; group: PlantGroup; count: number }
  | { key: string; type: 'item'; data: Plant };

export default function PlantsScreen() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<PlantGroup>>(() => new Set(['done']));
  const plantsQuery = useQuery({ queryKey: ['plants'], queryFn: plantsApi.list });

  // Ogni volta che si entra nella schermata, la sezione "Annaffiate" riparte
  // sempre chiusa (indipendentemente da come era stata lasciata l'ultima
  // volta), mentre "Da annaffiare" resta aperta. Stesso comportamento di
  // cleaning.tsx.
  useFocusEffect(
    useCallback(() => {
      setCollapsedGroups(new Set(['done']));
    }, [])
  );

  function toggleGroupCollapsed(group: PlantGroup) {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group);
      else next.add(group);
      return next;
    });
  }

  useSyncQueue(
    (data) => syncPlantReminders(data, t),
    Platform.OS === 'web' ? null : plantsQuery.data,
    [t]
  );

  const markWateredMutation = useMutation({
    mutationFn: (id: string) => plantsApi.markWatered(id),
    // Stesso aggiornamento ottimistico di cleaning.tsx: sposta subito la
    // pianta da "da annaffiare" a "annaffiata" invece di aspettare il
    // refetch dopo invalidateQueries.
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['plants'] });
      const previous = queryClient.getQueryData<Plant[]>(['plants']);
      queryClient.setQueryData<Plant[]>(['plants'], (old) =>
        old?.map((plant) => (plant.id === id ? { ...plant, daysSinceWatered: 0, overdue: false } : plant))
      );
      return { previous };
    },
    onError: (e, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['plants'], context.previous);
      showAlert(t('common.error'), getErrorMessage(e, t));
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['plants'] });
      cancelPlantReminder(id);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => plantsApi.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['plants'] });
      const previous = queryClient.getQueryData<Plant[]>(['plants']);
      queryClient.setQueryData<Plant[]>(['plants'], (old) => old?.filter((plant) => plant.id !== id));
      return { previous };
    },
    onError: (e, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['plants'], context.previous);
      showAlert(t('common.error'), getErrorMessage(e, t));
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['plants'] });
      cancelPlantReminder(id);
    },
  });

  function confirmDelete(plant: Plant) {
    showAlert(t('plants.confirmDeleteTitle'), t('plants.confirmDeleteMessage', { name: plant.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeMutation.mutate(plant.id) },
    ]);
  }

  // Swipe a destra: stesso popup usato in Panoramica per la stessa azione
  // (plants.confirmMarkWateredTitle/Message), dato che segna subito annaffiata.
  function confirmMarkWatered(plant: Plant) {
    showAlert(t('plants.confirmMarkWateredTitle'), t('plants.confirmMarkWateredMessage', { name: plant.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), onPress: () => markWateredMutation.mutate(plant.id) },
    ]);
  }

  const plants = useMemo(() => {
    const all = plantsQuery.data ?? [];
    const q = search.trim().toLowerCase();
    const filtered = q
      ? all.filter((plant) => plant.name.toLowerCase().includes(q) || (plant.location ?? '').toLowerCase().includes(q))
      : all;
    return [...filtered].sort((a, b) => {
      if (a.daysSinceWatered === null && b.daysSinceWatered === null) return 0;
      if (a.daysSinceWatered === null) return -1;
      if (b.daysSinceWatered === null) return 1;
      return b.daysSinceWatered - a.daysSinceWatered;
    });
  }, [plantsQuery.data, search]);

  const isSearching = search.trim().length > 0;

  const rows: PlantRow[] = useMemo(() => {
    const toWater = plants.filter((plant) => plant.overdue);
    const done = plants.filter((plant) => !plant.overdue);
    const result: PlantRow[] = [];
    if (toWater.length > 0) {
      result.push({ key: 'header-toWater', type: 'header', group: 'toWater', count: toWater.length });
      if (isSearching || !collapsedGroups.has('toWater')) {
        result.push(...toWater.map((plant) => ({ key: `item-${plant.id}`, type: 'item' as const, data: plant })));
      }
    }
    if (done.length > 0) {
      result.push({ key: 'header-done', type: 'header', group: 'done', count: done.length });
      if (isSearching || !collapsedGroups.has('done')) {
        result.push(...done.map((plant) => ({ key: `item-${plant.id}`, type: 'item' as const, data: plant })));
      }
    }
    return result;
  }, [plants, collapsedGroups, isSearching]);

  return (
    <View style={styles.container}>
      <View style={[styles.topSection, webCentered]}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.inkSoft} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('plants.searchPlaceholder')}
            placeholderTextColor={colors.inkSoft}
            style={styles.searchInput}
            underlineColorAndroid="transparent"
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.inkSoft} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        contentContainerStyle={[styles.list, webCentered, { paddingBottom: 20 + insets.bottom }]}
        ListEmptyComponent={
          <EmptyState
            icon="leaf-outline"
            title={t('plants.emptyTitle')}
            subtitle={t('plants.emptySubtitle')}
          />
        }
        renderItem={({ item: row }) => {
          if (row.type === 'header') {
            const collapsed = !isSearching && collapsedGroups.has(row.group);
            return (
              <Pressable style={styles.groupHeader} onPress={() => toggleGroupCollapsed(row.group)}>
                <Text style={styles.groupHeaderText}>
                  {t(row.group === 'toWater' ? 'plants.toWaterSection' : 'plants.doneSection')} ({row.count})
                </Text>
                <Ionicons name={collapsed ? 'chevron-down' : 'chevron-up'} size={16} color={colors.inkSoft} />
              </Pressable>
            );
          }

          const item = row.data;
          return (
            <SwipeableRow
              leftAction={{ onTrigger: () => confirmMarkWatered(item), icon: 'checkmark-done', color: colors.brand }}
              rightAction={deleteAction(colors, () => confirmDelete(item))}
              borderRadius={14}
              marginBottom={0}
            >
              <View style={[styles.card, item.overdue && styles.cardOverdue]}>
                <Pressable style={styles.cardInfo} onPress={() => router.push({ pathname: '/(app)/plant/[id]', params: { id: item.id } })}>
                  <Text style={styles.cardName}>
                    {item.name}
                    {item.location ? <Text style={styles.cardLocation}> · {item.location}</Text> : null}
                  </Text>
                  <Text style={styles.cardStatus}>
                    {item.daysSinceWatered === null
                      ? t('plants.neverWatered')
                      : item.daysSinceWatered === 0
                        ? t('plants.wateredToday')
                        : t('plants.wateredDaysAgo', { n: item.daysSinceWatered })}
                    {item.wateringFrequencyDays ? t('plants.everyDaysSuffix', { n: item.wateringFrequencyDays }) : ''}
                  </Text>
                  {item.overdue ? <Text style={styles.overdueLabel}>{t('plants.overdue')}</Text> : null}
                </Pressable>
                <View style={styles.cardActions}>
                  <Pressable onPress={() => confirmMarkWatered(item)} style={styles.waterButton} hitSlop={8}>
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                  </Pressable>
                  <Pressable onPress={() => router.push({ pathname: '/(app)/plant/[id]', params: { id: item.id } })} hitSlop={8}>
                    <Ionicons name="pencil-outline" size={18} color={colors.inkSoft} />
                  </Pressable>
                  <Pressable onPress={() => confirmDelete(item)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={colors.inkSoft} />
                  </Pressable>
                </View>
              </View>
            </SwipeableRow>
          );
        }}
      />

      <AddFab onPress={() => router.push('/(app)/plant/new')} bottom={24 + insets.bottom} />
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
    searchInput: { flex: 1, height: 20, fontSize: 14, color: COLORS.ink, paddingVertical: 0, includeFontPadding: false },
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
    cardLocation: { fontSize: 12, fontWeight: '500', color: COLORS.inkSoft },
    cardStatus: { fontSize: 12, color: COLORS.inkSoft },
    overdueLabel: { fontSize: 11, fontWeight: '700', color: COLORS.danger, marginTop: 2 },
    cardActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    waterButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: COLORS.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

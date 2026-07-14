import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getErrorMessage } from '../../../src/api/client';
import { itemsApi } from '../../../src/api/items';
import { showAlert } from '../../../src/components/AppAlert';
import { EmptyState } from '../../../src/components/EmptyState';
import { ItemCard } from '../../../src/components/ItemCard';
import { RestockDialog } from '../../../src/components/RestockDialog';
import { SectionTitle } from '../../../src/components/SectionTitle';
import { useStorageLocations } from '../../../src/hooks/useStorageLocations';
import { useI18n } from '../../../src/i18n/I18nContext';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';
import { webCentered } from '../../../src/theme/responsive';
import type { Item, ItemInput } from '../../../src/types';

export default function StockScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ storageLocationId?: string }>();
  const { locations, byId } = useStorageLocations();
  const [filterLocationId, setFilterLocationId] = useState<string>('TUTTI');
  const [search, setSearch] = useState('');
  const [onlyOpened, setOnlyOpened] = useState(false);
  const [restockTarget, setRestockTarget] = useState<Item | null>(null);

  const filters = useMemo(
    () => [{ key: 'TUTTI', label: t('stock.filterAll'), emoji: '📋' }, ...locations.map((l) => ({ key: l.id, label: l.name, emoji: l.emoji }))],
    [locations, t]
  );

  // Ogni volta che la schermata prende il focus (tab premuto o navigazione da
  // una zona), riparte da "Tutti" a meno che non arrivi un filtro esplicito.
  // Il parametro viene "consumato" subito con setParams: altrimenti expo-router
  // lo ripropone anche ai focus successivi (es. ri-premendo il tab Scorte),
  // facendo restare la schermata bloccata sull'ultima zona aperta da un link.
  // Si legge da un ref (invece che dalle dipendenze dell'effect) perche'
  // chiamare setParams qui dentro cambierebbe params.storageLocationId mentre
  // la schermata e' ancora a fuoco: se fosse nelle dipendenze, l'effect si
  // ririeseguirebbe subito e annullerebbe il filtro appena impostato.
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useFocusEffect(
    useCallback(() => {
      const zoneId = paramsRef.current.storageLocationId;
      if (zoneId) {
        setFilterLocationId(zoneId);
        router.setParams({ storageLocationId: undefined });
      } else {
        setFilterLocationId('TUTTI');
      }
    }, [])
  );

  const itemsQuery = useQuery({
    queryKey: ['items', 'list', filterLocationId, search],
    queryFn: () =>
      itemsApi.list({
        storageLocationId: filterLocationId === 'TUTTI' ? undefined : filterLocationId,
        search: search || undefined,
      }),
  });

  // Query separata, sempre senza filtri, usata solo per sapere se esistono
  // prodotti aperti (e quanti) a prescindere dalla zona/ricerca selezionata:
  // cosi' il chip "Aperti" non appare/scompare cambiando zona.
  const allItemsQuery = useQuery({ queryKey: ['items', 'list', 'TUTTI', ''], queryFn: () => itemsApi.list({}) });

  const adjustMutation = useMutation({
    mutationFn: ({
      id,
      delta,
      expirationDate,
      clearExpirationDate,
      hideFromShoppingList,
    }: {
      id: string;
      delta: number;
      expirationDate?: string | null;
      clearExpirationDate?: boolean;
      hideFromShoppingList?: boolean;
    }) => itemsApi.adjustQuantity(id, { delta, expirationDate: expirationDate ?? undefined, clearExpirationDate, hideFromShoppingList }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setRestockTarget(null);
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const newBatchMutation = useMutation({
    mutationFn: (input: ItemInput) => itemsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setRestockTarget(null);
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  function handleAdjust(item: Item, delta: number) {
    if (delta > 0) {
      setRestockTarget(item);
      return;
    }

    if (item.quantity + delta <= 0) {
      showAlert(t('stock.outOfStockTitle'), t('stock.outOfStockMessage', { name: item.name }), [
        { text: t('common.no'), style: 'cancel', onPress: () => adjustMutation.mutate({ id: item.id, delta, hideFromShoppingList: true }) },
        { text: t('common.yes'), onPress: () => adjustMutation.mutate({ id: item.id, delta, hideFromShoppingList: false }) },
      ]);
      return;
    }

    adjustMutation.mutate({ id: item.id, delta });
  }

  const items = useMemo(() => {
    const list = itemsQuery.data ?? [];
    return onlyOpened ? list.filter((i) => i.opened) : list;
  }, [itemsQuery.data, onlyOpened]);
  const openedCount = useMemo(() => (allItemsQuery.data ?? []).filter((i) => i.opened).length, [allItemsQuery.data]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <SectionTitle>{t('stock.title')}</SectionTitle>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.inkSoft} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('stock.searchPlaceholder')}
            placeholderTextColor={colors.inkSoft}
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersScroll}
          contentContainerStyle={styles.filters}
        >
          {filters.map((f) => {
            const active = filterLocationId === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilterLocationId(f.key)}
                style={[styles.filterChip, active && styles.filterChipActive]}
              >
                <Text style={styles.filterChipEmoji}>{f.emoji}</Text>
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
          {openedCount > 0 && (
            <Pressable
              onPress={() => setOnlyOpened((v) => !v)}
              style={[styles.filterChip, onlyOpened && styles.filterChipActive]}
            >
              <Ionicons name="lock-open-outline" size={12} color={onlyOpened ? colors.white : colors.gold} />
              <Text style={[styles.filterChipText, onlyOpened && styles.filterChipTextActive]}>
                {t('stock.openedFilter', { n: openedCount })}
              </Text>
            </Pressable>
          )}
        </ScrollView>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="cube-outline"
              title={t('stock.emptyTitle')}
              subtitle={t('stock.emptySubtitle')}
            />
          }
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              location={byId.get(item.storageLocationId)}
              onAdjust={(delta) => handleAdjust(item, delta)}
              onPress={() => router.push({ pathname: '/(app)/item/[id]', params: { id: item.id } })}
            />
          )}
        />
      </View>

      <RestockDialog
        visible={restockTarget !== null}
        itemName={restockTarget?.name ?? ''}
        currentExpirationDate={restockTarget?.expirationDate ?? null}
        onCancel={() => setRestockTarget(null)}
        onConfirm={({ mode, expirationDate }) => {
          if (!restockTarget) return;
          if (mode === 'same') {
            adjustMutation.mutate({ id: restockTarget.id, delta: 1 });
          } else {
            newBatchMutation.mutate({
              name: restockTarget.name,
              storageLocationId: restockTarget.storageLocationId,
              category: restockTarget.category,
              unit: restockTarget.unit,
              quantity: 1,
              expirationDate,
            });
          }
        }}
      />
    </SafeAreaView>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.bg },
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 20, gap: 12, ...webCentered },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchInput: { flex: 1, fontSize: 13, color: COLORS.ink },
    filtersScroll: { flexGrow: 0 },
    filters: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 4 },
    filterChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    filterChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
    filterChipEmoji: { fontSize: 12, lineHeight: 15 },
    filterChipText: { fontSize: 12, fontWeight: '600', color: COLORS.ink },
    filterChipTextActive: { color: COLORS.white },
    list: { paddingBottom: 120, paddingTop: 4 },
  });
}

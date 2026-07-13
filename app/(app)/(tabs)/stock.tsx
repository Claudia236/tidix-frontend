import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
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
import { COLORS } from '../../../src/theme/colors';
import { webCentered } from '../../../src/theme/responsive';
import type { Item, ItemInput } from '../../../src/types';

export default function StockScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ storageLocationId?: string }>();
  const { locations, byId } = useStorageLocations();
  const [filterLocationId, setFilterLocationId] = useState<string>('TUTTI');
  const [search, setSearch] = useState('');
  const [restockTarget, setRestockTarget] = useState<Item | null>(null);

  const filters = useMemo(
    () => [{ key: 'TUTTI', label: 'Tutti', emoji: '📋' }, ...locations.map((l) => ({ key: l.id, label: l.name, emoji: l.emoji }))],
    [locations]
  );

  useEffect(() => {
    if (params.storageLocationId) {
      setFilterLocationId(params.storageLocationId);
    }
  }, [params.storageLocationId]);

  const itemsQuery = useQuery({
    queryKey: ['items', 'list', filterLocationId, search],
    queryFn: () =>
      itemsApi.list({
        storageLocationId: filterLocationId === 'TUTTI' ? undefined : filterLocationId,
        search: search || undefined,
      }),
  });

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
    onError: (e) => showAlert('Errore', getErrorMessage(e)),
  });

  const newBatchMutation = useMutation({
    mutationFn: (input: ItemInput) => itemsApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setRestockTarget(null);
    },
    onError: (e) => showAlert('Errore', getErrorMessage(e)),
  });

  function handleAdjust(item: Item, delta: number) {
    if (delta > 0) {
      setRestockTarget(item);
      return;
    }

    if (item.quantity + delta <= 0) {
      showAlert('Scorta finita', `"${item.name}" è finita. Vuoi aggiungerla alla lista della spesa?`, [
        { text: 'No', style: 'cancel', onPress: () => adjustMutation.mutate({ id: item.id, delta, hideFromShoppingList: true }) },
        { text: 'Sì', onPress: () => adjustMutation.mutate({ id: item.id, delta, hideFromShoppingList: false }) },
      ]);
      return;
    }

    adjustMutation.mutate({ id: item.id, delta });
  }

  const items = itemsQuery.data ?? [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <SectionTitle>Le tue scorte</SectionTitle>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={COLORS.inkSoft} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cerca un prodotto..."
            placeholderTextColor={COLORS.inkSoft}
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
        </ScrollView>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="cube-outline"
              title="Nessun prodotto trovato"
              subtitle="Prova a modificare la ricerca o aggiungi un nuovo prodotto."
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

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20, gap: 12, ...webCentered },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
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
    backgroundColor: COLORS.white,
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

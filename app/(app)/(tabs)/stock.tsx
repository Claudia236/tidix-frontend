import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { itemsApi } from '../../../src/api/items';
import { EmptyState } from '../../../src/components/EmptyState';
import { ItemCard } from '../../../src/components/ItemCard';
import { SectionTitle } from '../../../src/components/SectionTitle';
import { ZONE_ORDER, ZONES } from '../../../src/constants/domain';
import { COLORS } from '../../../src/theme/colors';
import { webCentered } from '../../../src/theme/responsive';
import type { StorageZone } from '../../../src/types';

const FILTERS: { key: StorageZone | 'TUTTI'; label: string; emoji: string }[] = [
  { key: 'TUTTI', label: 'Tutti', emoji: '📋' },
  ...ZONE_ORDER.map((z) => ({ key: z, label: ZONES[z].label, emoji: ZONES[z].emoji })),
];

export default function StockScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ zone?: string }>();
  const [filterZone, setFilterZone] = useState<StorageZone | 'TUTTI'>('TUTTI');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (params.zone && ZONE_ORDER.includes(params.zone as StorageZone)) {
      setFilterZone(params.zone as StorageZone);
    }
  }, [params.zone]);

  const itemsQuery = useQuery({
    queryKey: ['items', 'list', filterZone, search],
    queryFn: () => itemsApi.list({ zone: filterZone === 'TUTTI' ? undefined : filterZone, search: search || undefined }),
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: number }) => itemsApi.adjustQuantity(id, delta),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });

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
          {FILTERS.map((f) => {
            const active = filterZone === f.key;
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilterZone(f.key)}
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
              onAdjust={(delta) => adjustMutation.mutate({ id: item.id, delta })}
              onPress={() => router.push({ pathname: '/(app)/item/[id]', params: { id: item.id } })}
            />
          )}
        />
      </View>
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

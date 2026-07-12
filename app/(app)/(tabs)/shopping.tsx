import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { itemsApi } from '../../../src/api/items';
import { categoryInfo, ZONES } from '../../../src/constants/domain';
import { EmptyState } from '../../../src/components/EmptyState';
import { SectionTitle } from '../../../src/components/SectionTitle';
import { COLORS } from '../../../src/theme/colors';
import { webCentered } from '../../../src/theme/responsive';
import type { Item } from '../../../src/types';

export default function ShoppingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const shoppingQuery = useQuery({ queryKey: ['items', 'shopping-list'], queryFn: itemsApi.shoppingList });

  const restockMutation = useMutation({
    mutationFn: (item: Item) => itemsApi.adjustQuantity(item.id, 1),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });

  const items = shoppingQuery.data ?? [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <SectionTitle>Lista della spesa</SectionTitle>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="cart-outline"
              title="La lista è vuota"
              subtitle="I prodotti finiti vengono aggiunti qui automaticamente."
            />
          }
          renderItem={({ item, index }) => {
            const category = categoryInfo(item.category);
            const zone = ZONES[item.zone];
            return (
              <View style={[styles.row, index === 0 && styles.rowFirst]}>
                <Pressable
                  onPress={() => restockMutation.mutate(item)}
                  style={styles.checkbox}
                  hitSlop={8}
                />
                <Pressable
                  style={styles.rowInfo}
                  onPress={() => router.push({ pathname: '/(app)/item/[id]', params: { id: item.id } })}
                >
                  <Text>{category.emoji}</Text>
                  <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                  <View style={[styles.zoneBadge, { backgroundColor: zone.bg }]}>
                    <Text style={[styles.zoneBadgeText, { color: zone.color }]}>{zone.code}</Text>
                  </View>
                </Pressable>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20, gap: 12, ...webCentered },
  list: { paddingBottom: 120 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderColor: COLORS.line,
  },
  rowFirst: { borderTopWidth: 0, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.brand },
  rowInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  rowName: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.ink },
  zoneBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  zoneBadgeText: { fontSize: 10, fontWeight: '700' },
});

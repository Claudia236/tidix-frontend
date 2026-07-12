import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { itemsApi } from '../../../src/api/items';
import { shoppingNotesApi } from '../../../src/api/shoppingNotes';
import { categoryInfo, locationCode, locationColor } from '../../../src/constants/domain';
import { EmptyState } from '../../../src/components/EmptyState';
import { RestockDialog } from '../../../src/components/RestockDialog';
import { SectionTitle } from '../../../src/components/SectionTitle';
import { useStorageLocations } from '../../../src/hooks/useStorageLocations';
import { COLORS } from '../../../src/theme/colors';
import { webCentered } from '../../../src/theme/responsive';
import type { Item, ShoppingNote } from '../../../src/types';

type Row =
  | { type: 'item'; data: Item }
  | { type: 'note'; data: ShoppingNote };

export default function ShoppingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { byId } = useStorageLocations();
  const [quickText, setQuickText] = useState('');
  const [restockTarget, setRestockTarget] = useState<Item | null>(null);

  const shoppingQuery = useQuery({ queryKey: ['items', 'shopping-list'], queryFn: itemsApi.shoppingList });
  const notesQuery = useQuery({ queryKey: ['shopping-notes'], queryFn: shoppingNotesApi.list });

  const restockMutation = useMutation({
    mutationFn: ({ id, expirationDate, clearExpirationDate }: { id: string; expirationDate: string | null; clearExpirationDate: boolean }) =>
      itemsApi.adjustQuantity(id, { delta: 1, expirationDate: expirationDate ?? undefined, clearExpirationDate }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setRestockTarget(null);
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: (text: string) => shoppingNotesApi.create(text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-notes'] });
      setQuickText('');
    },
  });

  const removeNoteMutation = useMutation({
    mutationFn: (id: string) => shoppingNotesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-notes'] }),
  });

  const rows: Row[] = useMemo(
    () => [
      ...(shoppingQuery.data ?? []).map((item): Row => ({ type: 'item', data: item })),
      ...(notesQuery.data ?? []).map((note): Row => ({ type: 'note', data: note })),
    ],
    [shoppingQuery.data, notesQuery.data]
  );

  function handleAddNote() {
    const text = quickText.trim();
    if (!text) return;
    addNoteMutation.mutate(text);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <SectionTitle>Lista della spesa</SectionTitle>

        <View style={styles.quickAddRow}>
          <TextInput
            value={quickText}
            onChangeText={setQuickText}
            onSubmitEditing={handleAddNote}
            placeholder="Aggiungi promemoria veloce..."
            placeholderTextColor={COLORS.inkSoft}
            style={styles.quickAddInput}
            returnKeyType="done"
          />
          <Pressable onPress={handleAddNote} style={styles.quickAddButton} hitSlop={8}>
            <Ionicons name="add" size={18} color={COLORS.white} />
          </Pressable>
        </View>

        <FlatList
          data={rows}
          keyExtractor={(row) => `${row.type}-${row.data.id}`}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="cart-outline"
              title="La lista è vuota"
              subtitle="I prodotti finiti vengono aggiunti qui automaticamente. Puoi anche aggiungere promemoria liberi."
            />
          }
          renderItem={({ item: row, index }) => {
            if (row.type === 'note') {
              return (
                <View style={[styles.row, index === 0 && styles.rowFirst]}>
                  <Pressable
                    onPress={() => removeNoteMutation.mutate(row.data.id)}
                    style={styles.checkbox}
                    hitSlop={8}
                  />
                  <Text style={styles.rowName} numberOfLines={1}>{row.data.text}</Text>
                </View>
              );
            }

            const item = row.data;
            const category = categoryInfo(item.category);
            const location = byId.get(item.storageLocationId);
            const { color: locationFg, bg: locationBg } = locationColor(item.storageLocationId);
            return (
              <View style={[styles.row, index === 0 && styles.rowFirst]}>
                <Pressable onPress={() => setRestockTarget(item)} style={styles.checkbox} hitSlop={8} />
                <Pressable
                  style={styles.rowInfo}
                  onPress={() => router.push({ pathname: '/(app)/item/[id]', params: { id: item.id } })}
                >
                  <Text>{category.emoji}</Text>
                  <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                  {location ? (
                    <View style={[styles.zoneBadge, { backgroundColor: locationBg }]}>
                      <Text style={[styles.zoneBadgeText, { color: locationFg }]}>{locationCode(location.name)}</Text>
                    </View>
                  ) : null}
                </Pressable>
              </View>
            );
          }}
        />
      </View>

      <RestockDialog
        visible={restockTarget !== null}
        itemName={restockTarget?.name ?? ''}
        currentExpirationDate={restockTarget?.expirationDate ?? null}
        onCancel={() => setRestockTarget(null)}
        onConfirm={({ expirationDate, clearExpirationDate }) => {
          if (!restockTarget) return;
          restockMutation.mutate({ id: restockTarget.id, expirationDate, clearExpirationDate });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 20, gap: 12, ...webCentered },
  quickAddRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  quickAddInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.ink,
  },
  quickAddButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
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

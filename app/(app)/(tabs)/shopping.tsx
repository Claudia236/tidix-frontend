import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getErrorMessage } from '../../../src/api/client';
import { itemsApi } from '../../../src/api/items';
import { shoppingNotesApi } from '../../../src/api/shoppingNotes';
import { showAlert } from '../../../src/components/AppAlert';
import { CATEGORIES, categoryInfo, locationCode, locationColor } from '../../../src/constants/domain';
import { EmptyState } from '../../../src/components/EmptyState';
import { RestockDialog } from '../../../src/components/RestockDialog';
import { SectionTitle } from '../../../src/components/SectionTitle';
import { useStorageLocations } from '../../../src/hooks/useStorageLocations';
import { COLORS } from '../../../src/theme/colors';
import { webCentered } from '../../../src/theme/responsive';
import type { Category, Item, ItemInput, ShoppingNote } from '../../../src/types';

type ToBuyRow =
  | { key: string; type: 'header'; category: Category }
  | { key: string; type: 'item'; data: Item }
  | { key: string; type: 'note'; data: ShoppingNote };

export default function ShoppingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { byId } = useStorageLocations();
  const [quickText, setQuickText] = useState('');
  const [quickCategory, setQuickCategory] = useState<Category | null>(null);
  const [restockTarget, setRestockTarget] = useState<Item | null>(null);

  const shoppingQuery = useQuery({ queryKey: ['items', 'shopping-list'], queryFn: itemsApi.shoppingList });
  const notesQuery = useQuery({ queryKey: ['shopping-notes'], queryFn: shoppingNotesApi.list });

  const adjustMutation = useMutation({
    mutationFn: ({ id, delta, expirationDate }: { id: string; delta: number; expirationDate?: string | null }) =>
      itemsApi.adjustQuantity(id, { delta, expirationDate: expirationDate ?? undefined }),
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

  const addNoteMutation = useMutation({
    mutationFn: () => shoppingNotesApi.create(quickText.trim(), quickCategory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-notes'] });
      setQuickText('');
      setQuickCategory(null);
    },
    onError: (e) => showAlert('Errore', getErrorMessage(e)),
  });

  const checkNoteMutation = useMutation({
    mutationFn: (id: string) => shoppingNotesApi.check(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-notes'] }),
    onError: (e) => showAlert('Errore', getErrorMessage(e)),
  });

  const uncheckNoteMutation = useMutation({
    mutationFn: (id: string) => shoppingNotesApi.uncheck(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-notes'] }),
    onError: (e) => showAlert('Errore', getErrorMessage(e)),
  });

  const removeNoteMutation = useMutation({
    mutationFn: (id: string) => shoppingNotesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-notes'] }),
    onError: (e) => showAlert('Errore', getErrorMessage(e)),
  });

  const toBuyRows: ToBuyRow[] = useMemo(() => {
    const items = shoppingQuery.data ?? [];
    const notes = (notesQuery.data ?? []).filter((n) => !n.checked);

    const byCategory = new Map<Category, ToBuyRow[]>();
    for (const item of items) {
      const cat = item.category;
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push({ key: `item-${item.id}`, type: 'item', data: item });
    }
    for (const note of notes) {
      const cat = note.category ?? 'ALTRO';
      if (!byCategory.has(cat)) byCategory.set(cat, []);
      byCategory.get(cat)!.push({ key: `note-${note.id}`, type: 'note', data: note });
    }

    const rows: ToBuyRow[] = [];
    for (const cat of CATEGORIES) {
      const group = byCategory.get(cat.key);
      if (group && group.length > 0) {
        rows.push({ key: `header-${cat.key}`, type: 'header', category: cat.key });
        rows.push(...group);
      }
    }
    return rows;
  }, [shoppingQuery.data, notesQuery.data]);

  const checkedNotes = useMemo(() => (notesQuery.data ?? []).filter((n) => n.checked), [notesQuery.data]);

  function handleAddNote() {
    if (!quickText.trim()) return;
    addNoteMutation.mutate();
  }

  function goAddToStock(note: ShoppingNote) {
    router.push({
      pathname: '/(app)/item/new',
      params: { name: note.text, category: note.category ?? undefined, sourceNoteId: note.id },
    });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.container, webCentered]}>
      <SectionTitle>Lista della spesa</SectionTitle>

      <View style={styles.quickAddRow}>
        <TextInput
          value={quickText}
          onChangeText={setQuickText}
          onSubmitEditing={handleAddNote}
          placeholder="Aggiungi cosa comprare..."
          placeholderTextColor={COLORS.inkSoft}
          style={styles.quickAddInput}
          returnKeyType="done"
        />
        <Pressable onPress={handleAddNote} style={styles.quickAddButton} hitSlop={8}>
          <Ionicons name="add" size={18} color={COLORS.white} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryRow}>
        {CATEGORIES.map((cat) => {
          const active = quickCategory === cat.key;
          return (
            <Pressable
              key={cat.key}
              onPress={() => setQuickCategory(active ? null : cat.key)}
              style={[styles.categoryChip, active && styles.categoryChipActive]}
            >
              <Text style={{ fontSize: 13 }}>{cat.emoji}</Text>
              <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{cat.short}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <FlatList
        data={toBuyRows}
        keyExtractor={(row) => row.key}
        scrollEnabled={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="cart-outline"
            title="La lista è vuota"
            subtitle="I prodotti finiti vengono aggiunti qui automaticamente. Puoi anche aggiungere cose da comprare a mano."
          />
        }
        renderItem={({ item: row }) => {
          if (row.type === 'header') {
            const info = categoryInfo(row.category);
            return (
              <Text style={styles.categoryHeader}>
                {info.emoji} {info.label}
              </Text>
            );
          }

          if (row.type === 'note') {
            const note = row.data;
            return (
              <View style={styles.row}>
                <Pressable onPress={() => checkNoteMutation.mutate(note.id)} style={styles.checkbox} hitSlop={8} />
                <Text style={styles.rowName} numberOfLines={1}>{note.text}</Text>
                <Pressable onPress={() => removeNoteMutation.mutate(note.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={16} color={COLORS.inkSoft} />
                </Pressable>
              </View>
            );
          }

          const item = row.data;
          const category = categoryInfo(item.category);
          const location = byId.get(item.storageLocationId);
          const { color: locationFg, bg: locationBg } = locationColor(item.storageLocationId);
          return (
            <View style={styles.row}>
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

      {checkedNotes.length > 0 ? (
        <View style={styles.checkedSection}>
          <SectionTitle small>Acquistato · da aggiungere alle scorte</SectionTitle>
          <FlatList
            data={checkedNotes}
            keyExtractor={(n) => n.id}
            scrollEnabled={false}
            contentContainerStyle={styles.list}
            renderItem={({ item: note }) => (
              <View style={styles.checkedRow}>
                <Text style={styles.rowName} numberOfLines={1}>{note.text}</Text>
                <Pressable onPress={() => uncheckNoteMutation.mutate(note.id)} hitSlop={8}>
                  <Ionicons name="arrow-undo-outline" size={16} color={COLORS.inkSoft} />
                </Pressable>
                <Pressable onPress={() => goAddToStock(note)} style={styles.addToStockButton} hitSlop={8}>
                  <Text style={styles.addToStockText}>Aggiungi a scorte</Text>
                </Pressable>
                <Pressable onPress={() => removeNoteMutation.mutate(note.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={16} color={COLORS.inkSoft} />
                </Pressable>
              </View>
            )}
          />
        </View>
      ) : null}

      </ScrollView>

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
  container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120, gap: 12 },
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
  categoryScroll: { flexGrow: 0 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingBottom: 2 },
  categoryChip: {
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
  categoryChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  categoryChipText: { fontSize: 11, fontWeight: '600', color: COLORS.ink },
  categoryChipTextActive: { color: COLORS.white },
  categoryHeader: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: COLORS.inkSoft,
    marginTop: 10,
    marginBottom: 4,
  },
  list: { gap: 0 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.brand },
  rowInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  rowName: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.ink },
  zoneBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  zoneBadgeText: { fontSize: 10, fontWeight: '700' },
  checkedSection: { gap: 8, marginTop: 12 },
  checkedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.okBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 6,
  },
  addToStockButton: {
    backgroundColor: COLORS.brand,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addToStockText: { fontSize: 11, fontWeight: '700', color: COLORS.white },
});

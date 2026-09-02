import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getErrorMessage } from '../../../src/api/client';
import { itemsApi } from '../../../src/api/items';
import { shoppingNotesApi } from '../../../src/api/shoppingNotes';
import { showAlert } from '../../../src/components/AppAlert';
import { useCategories, findCategoryInfo, useLocationColor, locationCode } from '../../../src/constants/domain';
import { EmptyState } from '../../../src/components/EmptyState';
import { RestockDialog } from '../../../src/components/RestockDialog';
import { SectionTitle } from '../../../src/components/SectionTitle';
import { deleteAction, SwipeableRow } from '../../../src/components/SwipeableRow';
import { useStorageLocations } from '../../../src/hooks/useStorageLocations';
import { useSupermarkets } from '../../../src/hooks/useSupermarkets';
import { useI18n } from '../../../src/i18n/I18nContext';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';
import { webCentered } from '../../../src/theme/responsive';
import type { Category, Item, ItemInput, ShoppingNote } from '../../../src/types';

type Leaf = { key: string; type: 'item'; data: Item } | { key: string; type: 'note'; data: ShoppingNote };

type ToBuyRow =
  | { key: string; type: 'header'; group: 'category'; category: Category; count: number }
  | { key: string; type: 'header'; group: 'supermarket'; supermarketId: string | null; count: number }
  | { key: string; type: 'subheader'; category: Category }
  | Leaf;

type GroupBy = 'category' | 'supermarket';

export default function ShoppingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { byId } = useStorageLocations();
  const { byId: supermarketById, supermarkets } = useSupermarkets();
  const categories = useCategories();
  const getLocationColor = useLocationColor();
  const [restockTarget, setRestockTarget] = useState<Item | null>(null);
  const [groupBy, setGroupBy] = useState<GroupBy>('category');
  const [collapsedCategories, setCollapsedCategories] = useState<Set<Category>>(new Set());
  const [collapsedSupermarkets, setCollapsedSupermarkets] = useState<Set<string>>(new Set());

  function toggleCategoryCollapsed(category: Category) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  function toggleSupermarketCollapsed(key: string) {
    setCollapsedSupermarkets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const shoppingQuery = useQuery({ queryKey: ['items', 'shopping-list'], queryFn: itemsApi.shoppingList });
  const notesQuery = useQuery({ queryKey: ['shopping-notes'], queryFn: shoppingNotesApi.list });

  const adjustMutation = useMutation({
    mutationFn: ({ id, delta, expirationDate }: { id: string; delta: number; expirationDate?: string | null }) =>
      itemsApi.adjustQuantity(id, { delta, expirationDate: expirationDate ?? undefined }),
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

  const checkNoteMutation = useMutation({
    mutationFn: (id: string) => shoppingNotesApi.check(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-notes'] }),
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const removeNoteMutation = useMutation({
    mutationFn: (id: string) => shoppingNotesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-notes'] }),
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const removeItemMutation = useMutation({
    mutationFn: (id: string) => itemsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  function confirmDeleteItem(item: Item) {
    showAlert(t('shopping.confirmRemoveItemTitle'), t('shopping.confirmRemoveItemMessage', { name: item.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeItemMutation.mutate(item.id) },
    ]);
  }

  function confirmDeleteNote(note: ShoppingNote) {
    showAlert(t('shoppingNote.confirmDeleteTitle'), t('shoppingNote.confirmDeleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeNoteMutation.mutate(note.id) },
    ]);
  }

  function confirmMarkPurchased(note: ShoppingNote) {
    showAlert(t('shopping.confirmMarkPurchasedTitle'), t('shopping.confirmMarkPurchasedMessage', { name: note.text }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), onPress: () => checkNoteMutation.mutate(note.id) },
    ]);
  }

  const toBuyRows: ToBuyRow[] = useMemo(() => {
    const items = shoppingQuery.data ?? [];
    const notes = (notesQuery.data ?? []).filter((n) => !n.checked);
    const leaves: Leaf[] = [
      ...items.map((item) => ({ key: `item-${item.id}`, type: 'item' as const, data: item })),
      ...notes.map((note) => ({ key: `note-${note.id}`, type: 'note' as const, data: note })),
    ];

    const rowName = (leaf: Leaf) => (leaf.type === 'item' ? leaf.data.name : leaf.data.text);
    const rowCategory = (leaf: Leaf): Category => (leaf.type === 'item' ? leaf.data.category : leaf.data.category ?? 'ALTRO');
    const rowSupermarketId = (leaf: Leaf): string | null => leaf.data.supermarketId ?? null;

    const byCategory = (source: Leaf[]) => {
      const map = new Map<Category, Leaf[]>();
      for (const leaf of source) {
        const cat = rowCategory(leaf);
        if (!map.has(cat)) map.set(cat, []);
        map.get(cat)!.push(leaf);
      }
      return map;
    };

    const rows: ToBuyRow[] = [];

    if (groupBy === 'category') {
      const grouped = byCategory(leaves);
      for (const cat of categories) {
        const group = grouped.get(cat.key);
        if (group && group.length > 0) {
          group.sort((a, b) => rowName(a).localeCompare(rowName(b), undefined, { sensitivity: 'base' }));
          rows.push({ key: `header-cat-${cat.key}`, type: 'header', group: 'category', category: cat.key, count: group.length });
          if (!collapsedCategories.has(cat.key)) rows.push(...group);
        }
      }
    } else {
      const bySupermarket = new Map<string, Leaf[]>();
      for (const leaf of leaves) {
        const supId = rowSupermarketId(leaf) ?? '';
        if (!bySupermarket.has(supId)) bySupermarket.set(supId, []);
        bySupermarket.get(supId)!.push(leaf);
      }
      const orderedIds = [...supermarkets.map((s) => s.id), ''];
      for (const supId of orderedIds) {
        const group = bySupermarket.get(supId);
        if (!group || group.length === 0) continue;
        const collapseKey = supId || 'none';
        rows.push({ key: `header-sup-${collapseKey}`, type: 'header', group: 'supermarket', supermarketId: supId || null, count: group.length });
        if (collapsedSupermarkets.has(collapseKey)) continue;

        const grouped = byCategory(group);
        for (const cat of categories) {
          const catGroup = grouped.get(cat.key);
          if (!catGroup || catGroup.length === 0) continue;
          catGroup.sort((a, b) => rowName(a).localeCompare(rowName(b), undefined, { sensitivity: 'base' }));
          rows.push({ key: `subheader-${collapseKey}-${cat.key}`, type: 'subheader', category: cat.key });
          rows.push(...catGroup);
        }
      }
    }
    return rows;
  }, [shoppingQuery.data, notesQuery.data, categories, collapsedCategories, collapsedSupermarkets, groupBy, supermarkets]);

  const purchasedCount = useMemo(() => (notesQuery.data ?? []).filter((n) => n.checked).length, [notesQuery.data]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <FlatList
        data={toBuyRows}
        keyExtractor={(row) => row.key}
        contentContainerStyle={[styles.container, webCentered]}
        ListHeaderComponent={
          <>
            <SectionTitle logo>{t('shopping.title')}</SectionTitle>

            {purchasedCount > 0 ? (
              <Pressable style={styles.purchasedBanner} onPress={() => router.push('/(app)/shopping-purchased')}>
                <View style={styles.purchasedBannerLeft}>
                  <Ionicons name="bag-check-outline" size={18} color={colors.brand} />
                  <Text style={styles.purchasedBannerText}>{t('shopping.purchasedBanner', { n: purchasedCount })}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
              </Pressable>
            ) : null}

            <View style={styles.groupByRow}>
              <Pressable
                onPress={() => setGroupBy('category')}
                style={[styles.groupByChip, groupBy === 'category' && styles.groupByChipActive]}
              >
                <Text style={[styles.groupByChipText, groupBy === 'category' && { color: colors.white }]}>
                  {t('shopping.groupBy.category')}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setGroupBy('supermarket')}
                style={[styles.groupByChip, groupBy === 'supermarket' && styles.groupByChipActive]}
              >
                <Text style={[styles.groupByChipText, groupBy === 'supermarket' && { color: colors.white }]}>
                  {t('shopping.groupBy.supermarket')}
                </Text>
              </Pressable>
            </View>
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="cart-outline"
            title={t('shopping.emptyTitle')}
            subtitle={t('shopping.emptySubtitle')}
          />
        }
        renderItem={({ item: row }) => {
          if (row.type === 'header' && row.group === 'category') {
            const info = findCategoryInfo(categories, row.category);
            const collapsed = collapsedCategories.has(row.category);
            return (
              <Pressable style={styles.categoryHeader} onPress={() => toggleCategoryCollapsed(row.category)}>
                <Text style={styles.categoryHeaderText}>
                  {info.emoji} {info.label} ({row.count})
                </Text>
                <Ionicons name={collapsed ? 'chevron-down' : 'chevron-up'} size={16} color={colors.inkSoft} />
              </Pressable>
            );
          }

          if (row.type === 'header' && row.group === 'supermarket') {
            const supermarket = row.supermarketId ? supermarketById.get(row.supermarketId) : null;
            const collapseKey = row.supermarketId ?? 'none';
            const collapsed = collapsedSupermarkets.has(collapseKey);
            return (
              <Pressable style={styles.categoryHeader} onPress={() => toggleSupermarketCollapsed(collapseKey)}>
                <Text style={styles.categoryHeaderText}>
                  {supermarket?.emoji ?? '🛒'} {supermarket?.name ?? t('shopping.noSupermarket')} ({row.count})
                </Text>
                <Ionicons name={collapsed ? 'chevron-down' : 'chevron-up'} size={16} color={colors.inkSoft} />
              </Pressable>
            );
          }

          if (row.type === 'subheader') {
            const info = findCategoryInfo(categories, row.category);
            return (
              <Text style={styles.subHeaderText}>{info.emoji} {info.label}</Text>
            );
          }

          if (row.type === 'note') {
            const note = row.data;
            const supermarket = groupBy === 'category' && note.supermarketId ? supermarketById.get(note.supermarketId) : null;
            return (
              <SwipeableRow
                leftAction={deleteAction(colors, () => confirmDeleteNote(note))}
                rightAction={{ onTrigger: () => confirmMarkPurchased(note), icon: 'checkmark-done', color: colors.brand }}
              >
                <View style={styles.row}>
                  <Pressable onPress={() => checkNoteMutation.mutate(note.id)} style={styles.checkbox} hitSlop={8} />
                  <Pressable
                    style={styles.rowTextInfo}
                    onPress={() => router.push({ pathname: '/(app)/shopping-note/[id]', params: { id: note.id } })}
                  >
                    <Text style={styles.rowNameStacked} numberOfLines={1}>{note.text}</Text>
                    {note.detail ? <Text style={styles.rowDetail} numberOfLines={1}>{note.detail}</Text> : null}
                    {supermarket ? <Text style={styles.rowDetail} numberOfLines={1}>{supermarket.name}</Text> : null}
                  </Pressable>
                  <Pressable
                    onPress={() => router.push({ pathname: '/(app)/shopping-note/[id]', params: { id: note.id } })}
                    style={styles.categoryTag}
                    hitSlop={8}
                  >
                    <Text style={{ fontSize: 13 }}>{note.category ? findCategoryInfo(categories, note.category).emoji : '🏷️'}</Text>
                  </Pressable>
                  <Pressable onPress={() => confirmDeleteNote(note)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={16} color={colors.inkSoft} />
                  </Pressable>
                </View>
              </SwipeableRow>
            );
          }

          const item = row.data;
          const category = findCategoryInfo(categories, item.category);
          const location = byId.get(item.storageLocationId);
          const { color: locationFg, bg: locationBg } = getLocationColor(item.storageLocationId);
          const supermarket = groupBy === 'category' && item.supermarketId ? supermarketById.get(item.supermarketId) : null;
          return (
            <SwipeableRow
              leftAction={deleteAction(colors, () => confirmDeleteItem(item))}
              rightAction={{ onTrigger: () => setRestockTarget(item), icon: 'checkmark-done', color: colors.brand }}
            >
              <View style={styles.row}>
                <Pressable onPress={() => setRestockTarget(item)} style={styles.checkbox} hitSlop={8} />
                <Pressable
                  style={styles.rowInfo}
                  onPress={() => router.push({ pathname: '/(app)/item/[id]', params: { id: item.id } })}
                >
                  <Text>{category.emoji}</Text>
                  <View style={styles.rowTextInfo}>
                    <View style={styles.itemNameRow}>
                      <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                      {location ? (
                        <View style={[styles.zoneBadge, { backgroundColor: locationBg }]}>
                          <Text style={[styles.zoneBadgeText, { color: locationFg }]}>{locationCode(location.name)}</Text>
                        </View>
                      ) : null}
                    </View>
                    {supermarket ? <Text style={styles.rowDetail} numberOfLines={1}>{supermarket.name}</Text> : null}
                  </View>
                </Pressable>
              </View>
            </SwipeableRow>
          );
        }}
      />

      <RestockDialog
        visible={restockTarget !== null}
        itemName={restockTarget?.name ?? ''}
        currentExpirationDate={restockTarget?.expirationDate ?? null}
        submitting={adjustMutation.isPending || newBatchMutation.isPending}
        onCancel={() => setRestockTarget(null)}
        onConfirm={({ mode, expirationDate }) => {
          if (!restockTarget) return;
          if (mode === 'same') {
            adjustMutation.mutate({ id: restockTarget.id, delta: 1 });
          } else {
            newBatchMutation.mutate({
              name: restockTarget.name,
              storageLocationId: restockTarget.storageLocationId,
              supermarketId: restockTarget.supermarketId,
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
    container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120 },
    categoryTag: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 1,
      borderColor: COLORS.line,
      alignItems: 'center',
      justifyContent: 'center',
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
      marginBottom: 4,
      paddingVertical: 2,
    },
    categoryHeaderText: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: COLORS.inkSoft,
    },
    groupByRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
    groupByChip: {
      flex: 1,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card,
      borderRadius: 10,
      paddingVertical: 8,
    },
    groupByChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
    groupByChipText: { fontSize: 12, fontWeight: '600', color: COLORS.ink },
    subHeaderText: {
      fontSize: 11,
      fontWeight: '600',
      color: COLORS.inkSoft,
      marginTop: 8,
      marginBottom: 2,
      paddingLeft: 4,
    },
    list: { gap: 0 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: COLORS.card,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 10,
      marginBottom: 6,
    },
    checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.brand },
    rowInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
    rowTextInfo: { flex: 1, minWidth: 0 },
    itemNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    rowName: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.ink },
    rowNameStacked: { fontSize: 14, fontWeight: '600', color: COLORS.ink },
    rowDetail: { fontSize: 12, color: COLORS.inkSoft, marginTop: 1 },
    zoneBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
    zoneBadgeText: { fontSize: 10, fontWeight: '700' },
    purchasedBanner: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: COLORS.card,
      borderRadius: 14,
      borderTopWidth: 2,
      borderStyle: 'dashed' as const,
      borderColor: COLORS.line,
      padding: 16,
      marginTop: 8,
    },
    purchasedBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    purchasedBannerText: { fontSize: 13, fontWeight: '600', color: COLORS.ink },
  });
}

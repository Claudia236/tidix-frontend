import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getErrorMessage } from '../../../src/api/client';
import { itemsApi } from '../../../src/api/items';
import { shoppingNotesApi } from '../../../src/api/shoppingNotes';
import { showAlert } from '../../../src/components/AppAlert';
import { useCategories, findCategoryInfo, useLocationColor, locationCode } from '../../../src/constants/domain';
import { EmptyState } from '../../../src/components/EmptyState';
import { RestockDialog } from '../../../src/components/RestockDialog';
import { SectionTitle } from '../../../src/components/SectionTitle';
import { useStorageLocations } from '../../../src/hooks/useStorageLocations';
import { useI18n } from '../../../src/i18n/I18nContext';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';
import { webCentered } from '../../../src/theme/responsive';
import type { Category, Item, ItemInput, ShoppingNote } from '../../../src/types';

type ToBuyRow =
  | { key: string; type: 'header'; category: Category; count: number }
  | { key: string; type: 'item'; data: Item }
  | { key: string; type: 'note'; data: ShoppingNote };

export default function ShoppingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { byId } = useStorageLocations();
  const categories = useCategories();
  const getLocationColor = useLocationColor();
  const [restockTarget, setRestockTarget] = useState<Item | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<Category>>(new Set());

  function toggleCategoryCollapsed(category: Category) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
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

    const rowName = (row: ToBuyRow) => (row.type === 'item' ? row.data.name : row.type === 'note' ? row.data.text : '');

    const rows: ToBuyRow[] = [];
    for (const cat of categories) {
      const group = byCategory.get(cat.key);
      if (group && group.length > 0) {
        group.sort((a, b) => rowName(a).localeCompare(rowName(b), undefined, { sensitivity: 'base' }));
        rows.push({ key: `header-${cat.key}`, type: 'header', category: cat.key, count: group.length });
        if (!collapsedCategories.has(cat.key)) rows.push(...group);
      }
    }
    return rows;
  }, [shoppingQuery.data, notesQuery.data, categories, collapsedCategories]);

  const purchasedCount = useMemo(() => (notesQuery.data ?? []).filter((n) => n.checked).length, [notesQuery.data]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.container, webCentered]}>
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

      <FlatList
        data={toBuyRows}
        keyExtractor={(row) => row.key}
        scrollEnabled={false}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon="cart-outline"
            title={t('shopping.emptyTitle')}
            subtitle={t('shopping.emptySubtitle')}
          />
        }
        renderItem={({ item: row }) => {
          if (row.type === 'header') {
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

          if (row.type === 'note') {
            const note = row.data;
            return (
              <View style={styles.row}>
                <Pressable onPress={() => checkNoteMutation.mutate(note.id)} style={styles.checkbox} hitSlop={8} />
                <Pressable
                  style={styles.rowTextInfo}
                  onPress={() => router.push({ pathname: '/(app)/shopping-note/[id]', params: { id: note.id } })}
                >
                  <Text style={styles.rowNameStacked} numberOfLines={1}>{note.text}</Text>
                  {note.detail ? <Text style={styles.rowDetail} numberOfLines={1}>{note.detail}</Text> : null}
                </Pressable>
                <Pressable
                  onPress={() => router.push({ pathname: '/(app)/shopping-note/[id]', params: { id: note.id } })}
                  style={styles.categoryTag}
                  hitSlop={8}
                >
                  <Text style={{ fontSize: 13 }}>{note.category ? findCategoryInfo(categories, note.category).emoji : '🏷️'}</Text>
                </Pressable>
                <Pressable onPress={() => removeNoteMutation.mutate(note.id)} hitSlop={8}>
                  <Ionicons name="trash-outline" size={16} color={colors.inkSoft} />
                </Pressable>
              </View>
            );
          }

          const item = row.data;
          const category = findCategoryInfo(categories, item.category);
          const location = byId.get(item.storageLocationId);
          const { color: locationFg, bg: locationBg } = getLocationColor(item.storageLocationId);
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

      </ScrollView>

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
    container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 120, gap: 12 },
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

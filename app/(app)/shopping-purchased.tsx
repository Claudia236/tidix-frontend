import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getErrorMessage } from '../../src/api/client';
import { shoppingNotesApi } from '../../src/api/shoppingNotes';
import { showAlert } from '../../src/components/AppAlert';
import { EmptyState } from '../../src/components/EmptyState';
import { deleteAction, SwipeableRow } from '../../src/components/SwipeableRow';
import { useI18n } from '../../src/i18n/I18nContext';
import type { ColorPalette } from '../../src/theme/colors';
import { useTheme } from '../../src/theme/ThemeContext';
import { webCentered } from '../../src/theme/responsive';
import type { ShoppingNote } from '../../src/types';

export default function ShoppingPurchasedScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const notesQuery = useQuery({ queryKey: ['shopping-notes'], queryFn: shoppingNotesApi.list });
  const checkedNotes = useMemo(() => (notesQuery.data ?? []).filter((n) => n.checked), [notesQuery.data]);

  const removeNoteMutation = useMutation({
    mutationFn: (id: string) => shoppingNotesApi.remove(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['shopping-notes'] });
      setSelectedIds((prev) => {
        if (!prev.has(id)) return prev;
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const removeSelectedMutation = useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => shoppingNotesApi.remove(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-notes'] });
      setSelectedIds(new Set());
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === checkedNotes.length ? new Set() : new Set(checkedNotes.map((n) => n.id))));
  }

  function confirmDeleteSelected() {
    const ids = [...selectedIds];
    showAlert(t('purchased.confirmDeleteSelectedTitle'), t('purchased.confirmDeleteSelectedMessage', { n: ids.length }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeSelectedMutation.mutate(ids) },
    ]);
  }

  function goAddToStock(note: ShoppingNote) {
    router.push({
      pathname: '/(app)/item/new',
      params: {
        name: note.text,
        category: note.category ?? undefined,
        supermarketId: note.supermarketId ?? undefined,
        sourceNoteId: note.id,
        purchaseDate: note.checkedAt ? note.checkedAt.slice(0, 10) : undefined,
      },
    });
  }

  function confirmDeleteNote(note: ShoppingNote) {
    showAlert(t('purchased.confirmDeleteTitle'), t('purchased.confirmDeleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeNoteMutation.mutate(note.id) },
    ]);
  }

  const allSelected = checkedNotes.length > 0 && selectedIds.size === checkedNotes.length;

  return (
    <View style={styles.container}>
      <FlatList
        data={checkedNotes}
        keyExtractor={(n) => n.id}
        contentContainerStyle={[styles.list, webCentered, { paddingBottom: 20 + insets.bottom }]}
        ListHeaderComponent={
          checkedNotes.length > 0 ? (
            <View style={styles.selectionBar}>
              <Pressable style={styles.selectAllRow} onPress={toggleSelectAll} hitSlop={6}>
                <Ionicons
                  name={allSelected ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={allSelected ? colors.brand : colors.inkSoft}
                />
                <Text style={styles.selectAllText}>{allSelected ? t('purchased.deselectAll') : t('purchased.selectAll')}</Text>
              </Pressable>
              {selectedIds.size > 0 ? (
                <Pressable style={styles.deleteSelectedButton} onPress={confirmDeleteSelected} hitSlop={6}>
                  <Text style={styles.deleteSelectedText}>{t('purchased.selectedCount', { n: selectedIds.size })}</Text>
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </Pressable>
              ) : null}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <EmptyState icon="checkmark-done-outline" title={t('purchased.emptyTitle')} subtitle={t('purchased.emptySubtitle')} />
        }
        renderItem={({ item: note }) => {
          const selected = selectedIds.has(note.id);
          return (
            <SwipeableRow
              leftAction={deleteAction(colors, () => confirmDeleteNote(note))}
              rightAction={{ onTrigger: () => goAddToStock(note), icon: 'cube-outline', color: colors.brand }}
            >
              <View style={styles.row}>
                <Pressable onPress={() => toggleSelected(note.id)} hitSlop={6}>
                  <Ionicons
                    name={selected ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={selected ? colors.brand : colors.inkSoft}
                  />
                </Pressable>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName} numberOfLines={1}>{note.text}</Text>
                  {note.detail ? <Text style={styles.rowDetail} numberOfLines={1}>{note.detail}</Text> : null}
                </View>
                <Pressable onPress={() => goAddToStock(note)} style={styles.addToStockButton} hitSlop={6}>
                  <Text style={styles.addToStockText}>{t('shopping.addToStock')}</Text>
                </Pressable>
                <Pressable onPress={() => confirmDeleteNote(note)} style={styles.deleteButton} hitSlop={6}>
                  <Ionicons name="trash-outline" size={18} color={colors.inkSoft} />
                </Pressable>
              </View>
            </SwipeableRow>
          );
        }}
      />
    </View>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    list: { padding: 20, gap: 8 },
    selectionBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
      marginBottom: 10,
    },
    selectAllRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    selectAllText: { fontSize: 13, fontWeight: '600', color: COLORS.inkSoft },
    deleteSelectedButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    deleteSelectedText: { fontSize: 13, fontWeight: '700', color: COLORS.danger },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: COLORS.okBg,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 10,
    },
    rowInfo: { flex: 1, minWidth: 0 },
    rowName: { fontSize: 14, fontWeight: '600', color: COLORS.ink },
    rowDetail: { fontSize: 12, color: COLORS.inkSoft, marginTop: 1 },
    addToStockButton: {
      backgroundColor: COLORS.brand,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    addToStockText: { fontSize: 11, fontWeight: '700', color: COLORS.white },
    deleteButton: { padding: 4 },
  });
}

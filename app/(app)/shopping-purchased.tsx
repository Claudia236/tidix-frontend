import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getErrorMessage } from '../../src/api/client';
import { shoppingNotesApi } from '../../src/api/shoppingNotes';
import { showAlert } from '../../src/components/AppAlert';
import { EmptyState } from '../../src/components/EmptyState';
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

  const notesQuery = useQuery({ queryKey: ['shopping-notes'], queryFn: shoppingNotesApi.list });
  const checkedNotes = useMemo(() => (notesQuery.data ?? []).filter((n) => n.checked), [notesQuery.data]);

  const removeNoteMutation = useMutation({
    mutationFn: (id: string) => shoppingNotesApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shopping-notes'] }),
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  function goAddToStock(note: ShoppingNote) {
    router.push({
      pathname: '/(app)/item/new',
      params: {
        name: note.text,
        category: note.category ?? undefined,
        sourceNoteId: note.id,
        purchaseDate: note.checkedAt ? note.checkedAt.slice(0, 10) : undefined,
      },
    });
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={checkedNotes}
        keyExtractor={(n) => n.id}
        contentContainerStyle={[styles.list, webCentered, { paddingBottom: 20 + insets.bottom }]}
        ListEmptyComponent={
          <EmptyState icon="checkmark-done-outline" title={t('purchased.emptyTitle')} subtitle={t('purchased.emptySubtitle')} />
        }
        renderItem={({ item: note }) => (
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.rowName} numberOfLines={1}>{note.text}</Text>
              {note.detail ? <Text style={styles.rowDetail} numberOfLines={1}>{note.detail}</Text> : null}
            </View>
            <Pressable onPress={() => goAddToStock(note)} style={styles.addToStockButton} hitSlop={6}>
              <Text style={styles.addToStockText}>{t('shopping.addToStock')}</Text>
            </Pressable>
            <Pressable onPress={() => removeNoteMutation.mutate(note.id)} style={styles.deleteButton} hitSlop={6}>
              <Ionicons name="trash-outline" size={18} color={colors.inkSoft} />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    list: { padding: 20, gap: 8 },
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

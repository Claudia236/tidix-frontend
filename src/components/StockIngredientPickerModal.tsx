import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { itemsApi } from '../api/items';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useModalBackHandler } from '../hooks/useModalBackHandler';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { webCentered } from '../theme/responsive';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (name: string) => void;
  // Nomi gia' aggiunti alla ricetta (confronto case-insensitive): non ha
  // senso riproporli nella lista.
  excludeNames: string[];
}

export function StockIngredientPickerModal({ visible, onClose, onSelect, excludeNames }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);

  useModalBackHandler(visible, onClose);

  // Stessa forma di queryKey usata in stock.tsx (zona 'TUTTI' + ricerca):
  // se l'utente ha gia' aperto le Scorte con la stessa ricerca, la cache e'
  // gia' pronta e non serve una nuova richiesta.
  const itemsQuery = useQuery({
    queryKey: ['items', 'list', 'TUTTI', debouncedSearch],
    queryFn: () => itemsApi.list({ search: debouncedSearch || undefined }),
    enabled: visible,
  });

  // Prodotti diversi possono condividere lo stesso nome (es. in zone
  // diverse): qui interessa solo l'elenco di nomi distinti da proporre come
  // ingrediente.
  const excludeSet = useMemo(
    () => new Set(excludeNames.map((name) => name.trim().toLowerCase())),
    [excludeNames]
  );
  const selectableNames = useMemo(() => {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const item of itemsQuery.data ?? []) {
      const key = item.name.trim().toLowerCase();
      if (seen.has(key) || excludeSet.has(key)) continue;
      seen.add(key);
      names.push(item.name);
    }
    return names;
  }, [itemsQuery.data, excludeSet]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.body, webCentered]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('recipeModal.pickerTitle')}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={16} color={colors.inkSoft} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={t('stock.searchPlaceholder')}
              placeholderTextColor={colors.inkSoft}
              style={styles.searchInput}
              underlineColorAndroid="transparent"
            />
            {search.length > 0 ? (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={colors.inkSoft} />
              </Pressable>
            ) : null}
          </View>

          <FlatList
            data={selectableNames}
            keyExtractor={(name) => name}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {itemsQuery.isLoading ? t('recipeModal.pickerLoading') : t('recipeModal.pickerEmpty')}
              </Text>
            }
            renderItem={({ item: name }) => (
              <Pressable style={styles.row} onPress={() => onSelect(name)}>
                <Text style={styles.rowText}>{name}</Text>
                <Ionicons name="add-circle-outline" size={20} color={colors.brand} />
              </Pressable>
            )}
          />

          <View style={styles.footer}>
            <PrimaryButton label={t('common.close')} onPress={onClose} variant="secondary" />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.bg },
    body: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.line,
    },
    headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.ink },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 10,
      marginHorizontal: 20,
      marginTop: 14,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchInput: { flex: 1, height: 20, fontSize: 13, color: COLORS.ink, paddingVertical: 0, includeFontPadding: false },
    list: { padding: 20, gap: 8, flexGrow: 1 },
    emptyText: { fontSize: 13, color: COLORS.inkSoft, textAlign: 'center', paddingVertical: 40 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: COLORS.card,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: COLORS.line,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    rowText: { fontSize: 14, color: COLORS.ink, flex: 1 },
    footer: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: COLORS.line },
  });
}

import { Ionicons } from '@expo/vector-icons';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { ParamListBase } from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getErrorMessage } from '../../../src/api/client';
import { itemsApi } from '../../../src/api/items';
import { showAlert } from '../../../src/components/AppAlert';
import { useCategories, findCategoryInfo } from '../../../src/constants/domain';
import { EmptyState } from '../../../src/components/EmptyState';
import { ItemCard } from '../../../src/components/ItemCard';
import { RestockDialog } from '../../../src/components/RestockDialog';
import { SectionTitle } from '../../../src/components/SectionTitle';
import { useModalBackHandler } from '../../../src/hooks/useModalBackHandler';
import { useStorageLocations } from '../../../src/hooks/useStorageLocations';
import { useI18n } from '../../../src/i18n/I18nContext';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';
import { webCentered } from '../../../src/theme/responsive';
import type { Category, Item, ItemInput } from '../../../src/types';

type StockRow = { key: string; type: 'header'; category: Category; count: number } | { key: string; type: 'item'; data: Item };
type DateSortBy = 'none' | 'purchaseDate' | 'expirationDate';
type DateSortDirection = 'oldestFirst' | 'newestFirst';

export default function StockScreen() {
  const router = useRouter();
  const navigation = useNavigation<BottomTabNavigationProp<ParamListBase>>();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ storageLocationId?: string }>();
  const { locations, byId } = useStorageLocations();
  const categories = useCategories();
  const [filterLocationId, setFilterLocationId] = useState<string>('TUTTI');
  const [search, setSearch] = useState('');
  const [onlyOpened, setOnlyOpened] = useState(false);
  const [groupByCategory, setGroupByCategory] = useState(true);
  const [dateSortBy, setDateSortBy] = useState<DateSortBy>('none');
  const [purchaseDateDirection, setPurchaseDateDirection] = useState<DateSortDirection>('oldestFirst');
  const [expirationDateDirection, setExpirationDateDirection] = useState<DateSortDirection>('oldestFirst');
  const [restockTarget, setRestockTarget] = useState<Item | null>(null);
  // Tutte le categorie collassate fin dal primissimo render: il listener
  // tabPress (sotto) copre i tap successivi sul tab, ma non scatta mai per la
  // primissima navigazione verso questa schermata, dato che il componente
  // (e quindi il listener) non esiste ancora finche' non viene montato.
  const [collapsedCategories, setCollapsedCategories] = useState<Set<Category>>(
    () => new Set(categories.map((c) => c.key))
  );
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  useModalBackHandler(filterModalVisible, () => setFilterModalVisible(false));

  function toggleCategoryCollapsed(category: Category) {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  const filters = useMemo(
    () => [{ key: 'TUTTI', label: t('stock.filterAll'), emoji: '📋' }, ...locations.map((l) => ({ key: l.id, label: l.name, emoji: l.emoji }))],
    [locations, t]
  );

  // Il parametro storageLocationId (link esplicito a una zona, es. da una
  // card della Panoramica) viene "consumato" subito con setParams: altrimenti
  // expo-router lo riproporrebbe anche ai focus successivi, facendo restare
  // la schermata bloccata sull'ultima zona aperta da un link. Si legge da un
  // ref (invece che dalle dipendenze dell'effect) perche' chiamare setParams
  // qui dentro cambierebbe params.storageLocationId mentre la schermata e'
  // ancora a fuoco: se fosse nelle dipendenze, l'effect si ririeseguirebbe
  // subito e annullerebbe il filtro appena impostato.
  const paramsRef = useRef(params);
  paramsRef.current = params;

  useFocusEffect(
    useCallback(() => {
      const zoneId = paramsRef.current.storageLocationId;
      if (zoneId) {
        setFilterLocationId(zoneId);
        router.setParams({ storageLocationId: undefined });
        setCollapsedCategories(new Set(categories.map((c) => c.key)));
      }
    }, [categories])
  );

  // Ogni volta che si preme (fisicamente) il tab "Scorte" nella barra in
  // basso, la schermata torna alla vista di default: categorie collassate,
  // ordinate per categoria, nessun filtro attivo. A differenza di
  // useFocusEffect, l'evento tabPress scatta solo sul tap del pulsante del
  // tab (non quando si torna da una schermata modale come modifica prodotto),
  // cosi' non si perde il contesto solo per aver chiuso un dettaglio.
  useEffect(() => {
    const unsubscribe = navigation.addListener('tabPress', () => {
      setFilterLocationId('TUTTI');
      setOnlyOpened(false);
      setSearch('');
      setGroupByCategory(true);
      setDateSortBy('none');
      setCollapsedCategories(new Set(categories.map((c) => c.key)));
    });
    return unsubscribe;
  }, [navigation, categories]);

  const itemsQuery = useQuery({
    queryKey: ['items', 'list', filterLocationId, search],
    queryFn: () =>
      itemsApi.list({
        storageLocationId: filterLocationId === 'TUTTI' ? undefined : filterLocationId,
        search: search || undefined,
      }),
  });

  // Query separata, sempre senza filtri, usata solo per sapere se esistono
  // prodotti aperti (e quanti) a prescindere dalla zona/ricerca selezionata:
  // cosi' il chip "Aperti" non appare/scompare cambiando zona.
  const allItemsQuery = useQuery({ queryKey: ['items', 'list', 'TUTTI', ''], queryFn: () => itemsApi.list({}) });

  const adjustMutation = useMutation({
    mutationFn: ({
      id,
      delta,
      expirationDate,
      clearExpirationDate,
      hideFromShoppingList,
      clearOpened,
    }: {
      id: string;
      delta: number;
      expirationDate?: string | null;
      clearExpirationDate?: boolean;
      hideFromShoppingList?: boolean;
      clearOpened?: boolean;
    }) => itemsApi.adjustQuantity(id, { delta, expirationDate: expirationDate ?? undefined, clearExpirationDate, hideFromShoppingList, clearOpened }),
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

  function handleAdjust(item: Item, delta: number) {
    if (delta > 0) {
      setRestockTarget(item);
      return;
    }

    if (item.quantity + delta <= 0) {
      showAlert(t('stock.outOfStockTitle'), t('stock.outOfStockMessage', { name: item.name }), [
        { text: t('common.no'), style: 'cancel', onPress: () => adjustMutation.mutate({ id: item.id, delta, hideFromShoppingList: true }) },
        { text: t('common.yes'), onPress: () => adjustMutation.mutate({ id: item.id, delta, hideFromShoppingList: false }) },
      ]);
      return;
    }

    if (item.opened && item.quantity > 1) {
      showAlert(t('stock.removeOpenedTitle'), t('stock.removeOpenedMessage', { name: item.name }), [
        { text: t('common.no'), style: 'cancel', onPress: () => adjustMutation.mutate({ id: item.id, delta }) },
        { text: t('common.yes'), onPress: () => adjustMutation.mutate({ id: item.id, delta, clearOpened: true }) },
      ]);
      return;
    }

    adjustMutation.mutate({ id: item.id, delta });
  }

  const items = useMemo(() => {
    const list = itemsQuery.data ?? [];
    const filtered = onlyOpened ? list.filter((i) => i.opened) : list;
    if (dateSortBy === 'purchaseDate') {
      // Chi non ha una data di acquisto (prodotti storici) va sempre in fondo,
      // indipendentemente dalla direzione scelta.
      const sign = purchaseDateDirection === 'oldestFirst' ? 1 : -1;
      return [...filtered].sort((a, b) => {
        if (!a.purchaseDate && !b.purchaseDate) return 0;
        if (!a.purchaseDate) return 1;
        if (!b.purchaseDate) return -1;
        return sign * a.purchaseDate.localeCompare(b.purchaseDate);
      });
    }
    if (dateSortBy === 'expirationDate') {
      // Chi non ha una scadenza va sempre in fondo, indipendentemente dalla
      // direzione scelta.
      const sign = expirationDateDirection === 'oldestFirst' ? 1 : -1;
      return [...filtered].sort((a, b) => {
        if (!a.expirationDate && !b.expirationDate) return 0;
        if (!a.expirationDate) return 1;
        if (!b.expirationDate) return -1;
        return sign * a.expirationDate.localeCompare(b.expirationDate);
      });
    }
    return filtered;
  }, [itemsQuery.data, onlyOpened, dateSortBy, purchaseDateDirection, expirationDateDirection]);
  const openedCount = useMemo(() => (allItemsQuery.data ?? []).filter((i) => i.opened).length, [allItemsQuery.data]);
  const isFilterActive = onlyOpened || filterLocationId !== 'TUTTI' || !groupByCategory || dateSortBy !== 'none';

  function handleDateSortPress(key: Exclude<DateSortBy, 'none'>) {
    setDateSortBy((prev) => (prev === key ? 'none' : key));
  }

  const dateSortOptions: { key: Exclude<DateSortBy, 'none'>; label: string; direction: DateSortDirection; toggleDirection: () => void }[] = [
    {
      key: 'purchaseDate',
      label: t('stock.sortByPurchaseDate'),
      direction: purchaseDateDirection,
      toggleDirection: () => setPurchaseDateDirection((d) => (d === 'oldestFirst' ? 'newestFirst' : 'oldestFirst')),
    },
    {
      key: 'expirationDate',
      label: t('stock.sortByExpirationDate'),
      direction: expirationDateDirection,
      toggleDirection: () => setExpirationDateDirection((d) => (d === 'oldestFirst' ? 'newestFirst' : 'oldestFirst')),
    },
  ];

  // Con "Categoria" selezionata (anche insieme a una data), raggruppiamo gli
  // item per categoria (nell'ordine delle categorie), con header collassabili,
  // senza toccare l'ordine gia' scelto all'interno di ciascun gruppo (per nome
  // di default, oppure per data se e' stata selezionata anche una delle due
  // date). Senza "Categoria" invece si vuole un unico elenco su tutte le
  // scorte, senza raggruppamento ne' header.
  const isSearching = search.trim().length > 0;

  const stockRows: StockRow[] = useMemo(() => {
    if (!groupByCategory) {
      return items.map((item) => ({ key: `item-${item.id}`, type: 'item' as const, data: item }));
    }

    const byCategory = new Map<Category, Item[]>();
    for (const item of items) {
      if (!byCategory.has(item.category)) byCategory.set(item.category, []);
      byCategory.get(item.category)!.push(item);
    }

    const rows: StockRow[] = [];
    for (const cat of categories) {
      const group = byCategory.get(cat.key);
      if (!group || group.length === 0) continue;
      rows.push({ key: `header-${cat.key}`, type: 'header', category: cat.key, count: group.length });
      if (isSearching || !collapsedCategories.has(cat.key)) {
        rows.push(...group.map((item) => ({ key: `item-${item.id}`, type: 'item' as const, data: item })));
      }
    }
    return rows;
  }, [items, categories, collapsedCategories, groupByCategory, isSearching]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <SectionTitle logo>{t('stock.title')}</SectionTitle>
          <Pressable
            onPress={() => setFilterModalVisible(true)}
            hitSlop={8}
            accessibilityLabel={t('stock.filterModalTitle')}
          >
            <Ionicons
              name={isFilterActive ? 'filter' : 'filter-outline'}
              size={20}
              color={isFilterActive ? colors.brand : colors.inkSoft}
            />
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
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.inkSoft} />
            </Pressable>
          ) : null}
        </View>

        <FlatList
          data={stockRows}
          keyExtractor={(row) => row.key}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="cube-outline"
              title={t('stock.emptyTitle')}
              subtitle={t('stock.emptySubtitle')}
            />
          }
          renderItem={({ item: row }) => {
            if (row.type === 'header') {
              const info = findCategoryInfo(categories, row.category);
              const collapsed = !isSearching && collapsedCategories.has(row.category);
              return (
                <Pressable style={styles.categoryHeader} onPress={() => toggleCategoryCollapsed(row.category)}>
                  <Text style={styles.categoryHeaderText}>
                    {info.emoji} {info.label} ({row.count})
                  </Text>
                  <Ionicons name={collapsed ? 'chevron-down' : 'chevron-up'} size={16} color={colors.inkSoft} />
                </Pressable>
              );
            }

            const item = row.data;
            return (
              <ItemCard
                item={item}
                location={byId.get(item.storageLocationId)}
                onAdjust={(delta) => handleAdjust(item, delta)}
                onPress={() => router.push({ pathname: '/(app)/item/[id]', params: { id: item.id } })}
              />
            );
          }}
        />
      </View>

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

      <Modal visible={filterModalVisible} transparent animationType="fade" onRequestClose={() => setFilterModalVisible(false)}>
        <Pressable style={styles.filterBackdrop} onPress={() => setFilterModalVisible(false)}>
          <Pressable style={styles.filterCard} onPress={() => {}}>
            <ScrollView>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionLabel}>{t('stock.sortLabel')}</Text>

                <Pressable style={styles.filterOptionRow} onPress={() => setGroupByCategory((v) => !v)}>
                  <Ionicons name={groupByCategory ? 'checkbox' : 'square-outline'} size={20} color={groupByCategory ? colors.brand : colors.inkSoft} />
                  <Text style={styles.filterOptionText}>{t('stock.sortByName')}</Text>
                </Pressable>

                <View style={styles.filterInlineDivider} />

                {dateSortOptions.map((opt) => {
                  const active = dateSortBy === opt.key;
                  return (
                    <View key={opt.key} style={styles.filterDateOptionRow}>
                      <Pressable style={styles.filterDateOptionPressable} onPress={() => handleDateSortPress(opt.key)}>
                        <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={20} color={active ? colors.brand : colors.inkSoft} />
                        <Text style={styles.filterOptionTextGrow}>{opt.label}</Text>
                      </Pressable>
                      {active ? (
                        <Pressable onPress={opt.toggleDirection} hitSlop={8}>
                          <Ionicons
                            name={opt.direction === 'oldestFirst' ? 'arrow-down' : 'arrow-up'}
                            size={14}
                            color={colors.brand}
                          />
                        </Pressable>
                      ) : null}
                    </View>
                  );
                })}
              </View>

              <View style={[styles.filterSection, styles.filterSectionAlt]}>
                <Text style={styles.filterSectionLabel}>{t('stock.filterLabel')}</Text>

                {openedCount > 0 ? (
                  <Pressable
                    style={styles.filterOptionRow}
                    onPress={() => setOnlyOpened((v) => !v)}
                  >
                    <Ionicons name={onlyOpened ? 'checkbox' : 'square-outline'} size={20} color={onlyOpened ? colors.brand : colors.inkSoft} />
                    <Text style={styles.filterOptionEmoji}>🔓</Text>
                    <Text style={styles.filterOptionText}>{t('stock.openedFilter', { n: openedCount })}</Text>
                  </Pressable>
                ) : null}

                {openedCount > 0 ? <View style={styles.filterInlineDivider} /> : null}

                {filters.map((f) => {
                  const active = filterLocationId === f.key;
                  return (
                    <Pressable key={f.key} style={styles.filterOptionRow} onPress={() => setFilterLocationId(f.key)}>
                      <Ionicons name={active ? 'radio-button-on' : 'radio-button-off'} size={20} color={active ? colors.brand : colors.inkSoft} />
                      <Text style={styles.filterOptionEmoji}>{f.emoji}</Text>
                      <Text style={styles.filterOptionText}>{f.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <Pressable onPress={() => setFilterModalVisible(false)} hitSlop={8}>
              <Text style={styles.filterCardClose}>{t('common.close')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.bg },
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 20, gap: 12, ...webCentered },
    searchBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    searchInput: { flex: 1, fontSize: 13, color: COLORS.ink },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    filterBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    filterCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, paddingTop: 16, gap: 12, width: '100%', maxWidth: 360, maxHeight: '80%' },
    filterSection: {
      backgroundColor: COLORS.bg,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 4,
    },
    filterSectionAlt: { marginTop: 12 },
    filterSectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: COLORS.brand,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      marginBottom: 2,
    },
    filterOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
    filterDateOptionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    filterDateOptionPressable: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    filterOptionEmoji: { fontSize: 15 },
    filterOptionText: { fontSize: 14, color: COLORS.ink },
    filterOptionTextGrow: { flex: 1, fontSize: 14, color: COLORS.ink },
    filterInlineDivider: { height: 1, backgroundColor: COLORS.line, marginVertical: 4 },
    filterCardClose: { textAlign: 'center', fontSize: 13, fontWeight: '600', color: COLORS.inkSoft, marginTop: 4 },
    list: { paddingBottom: 120, paddingTop: 4 },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
      marginBottom: 6,
      paddingVertical: 2,
    },
    categoryHeaderText: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: COLORS.inkSoft,
    },
  });
}

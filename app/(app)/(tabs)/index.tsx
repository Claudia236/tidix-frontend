import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cleaningApi } from '../../../src/api/cleaning';
import { itemsApi } from '../../../src/api/items';
import { wasteApi } from '../../../src/api/waste';
import { SectionTitle } from '../../../src/components/SectionTitle';
import { findCategoryInfo, getWasteTypeEmoji, jsWeekdayToDay, useCategories, wasteTypesCollectedOn } from '../../../src/constants/domain';
import { useI18n } from '../../../src/i18n/I18nContext';
import { syncExpiryReminders } from '../../../src/notifications/expiryReminders';
import { syncOpenedReminders } from '../../../src/notifications/openedReminders';
import { syncWasteReminders } from '../../../src/notifications/wasteReminders';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';
import { webCentered } from '../../../src/theme/responsive';
import type { Item, ZoneSummary } from '../../../src/types';
import { daysUntil, formatShortDate, getExpiryInfo } from '../../../src/utils/expiry';

export default function OverviewScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, scheme } = useTheme();
  const { t, language } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const categories = useCategories();

  const summaryQuery = useQuery({ queryKey: ['items', 'summary'], queryFn: itemsApi.summary });
  const expiredQuery = useQuery({ queryKey: ['items', 'expired'], queryFn: itemsApi.expired });
  const expiringQuery = useQuery({ queryKey: ['items', 'expiring', 3], queryFn: () => itemsApi.expiring(3) });
  const shoppingQuery = useQuery({ queryKey: ['items', 'shopping-list'], queryFn: itemsApi.shoppingList });
  const cleaningQuery = useQuery({ queryKey: ['cleaning-tasks'], queryFn: cleaningApi.list });
  const wasteSchedulesQuery = useQuery({ queryKey: ['waste-schedules'], queryFn: wasteApi.list });
  const allItemsQuery = useQuery({ queryKey: ['items', 'list', 'TUTTI', ''], queryFn: () => itemsApi.list({}) });

  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(
    () => new Set(['avanzi', 'opened', 'expiring', 'cleaning'])
  );

  useFocusEffect(
    useCallback(() => {
      setCollapsedCards(new Set(['avanzi', 'opened', 'expiring', 'cleaning']));
    }, [])
  );

  function toggleCardCollapsed(key: string) {
    setCollapsedCards((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function categoryEmoji(category: Item['category']): string {
    return findCategoryInfo(categories, category).emoji;
  }

  const overdueCleaning = useMemo(
    () =>
      (cleaningQuery.data ?? [])
        .filter((task) => task.overdue)
        .sort((a, b) => {
          if (a.daysSinceCleaned === null && b.daysSinceCleaned === null) return 0;
          if (a.daysSinceCleaned === null) return -1;
          if (b.daysSinceCleaned === null) return 1;
          return b.daysSinceCleaned - a.daysSinceCleaned;
        }),
    [cleaningQuery.data]
  );

  const expiringItems = useMemo(() => {
    const combined = [...(expiredQuery.data ?? []), ...(expiringQuery.data ?? [])];
    return combined.filter((i) => i.category !== 'AVANZI' && !i.opened).sort((a, b) => (a.daysUntilExpiration ?? 0) - (b.daysUntilExpiration ?? 0));
  }, [expiredQuery.data, expiringQuery.data]);

  const openedItems = useMemo(() => (allItemsQuery.data ?? []).filter((i) => i.opened), [allItemsQuery.data]);

  const avanziItems = useMemo(() => (allItemsQuery.data ?? []).filter((i) => i.category === 'AVANZI'), [allItemsQuery.data]);

  const wasteTomorrow = useMemo(() => {
    if (!wasteSchedulesQuery.data) return [];
    const now = new Date();
    if (now.getHours() < 20) return [];
    const tomorrow = jsWeekdayToDay((now.getDay() + 1) % 7);
    return wasteTypesCollectedOn(wasteSchedulesQuery.data, tomorrow);
  }, [wasteSchedulesQuery.data]);

  const wasteTomorrowLabel = useMemo(() => {
    const labels = wasteTomorrow.map((w) => `${t(`wastePartitive.${w}`)} ${getWasteTypeEmoji(w)}`);
    if (labels.length <= 1) return labels.join('');
    const conjunction = language === 'it' ? ' e ' : language === 'es' ? ' y ' : ' and ';
    return `${labels.slice(0, -1).join(', ')}${conjunction}${labels[labels.length - 1]}`;
  }, [wasteTomorrow, t, language]);

  useEffect(() => {
    if (Platform.OS === 'web' || !expiringQuery.data) return;
    syncExpiryReminders(expiringQuery.data, t);
  }, [expiringQuery.data, t]);

  useEffect(() => {
    if (Platform.OS === 'web' || !wasteSchedulesQuery.data) return;
    syncWasteReminders(wasteSchedulesQuery.data, t);
  }, [wasteSchedulesQuery.data, t]);

  useEffect(() => {
    if (Platform.OS === 'web' || !allItemsQuery.data) return;
    syncOpenedReminders(allItemsQuery.data, t);
  }, [allItemsQuery.data, t]);

  function refresh() {
    summaryQuery.refetch();
    expiredQuery.refetch();
    expiringQuery.refetch();
    shoppingQuery.refetch();
    cleaningQuery.refetch();
    allItemsQuery.refetch();
  }

  function goToItem(item: Item) {
    router.push({ pathname: '/(app)/item/[id]', params: { id: item.id } });
  }

  function goToZone(zone: ZoneSummary) {
    router.push({ pathname: '/(app)/(tabs)/stock', params: { storageLocationId: zone.storageLocationId } });
  }

  const shoppingCount = shoppingQuery.data?.length ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={summaryQuery.isFetching} onRefresh={refresh} />}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image
              source={scheme === 'dark' ? require('../../../assets/logo-mark-white.png') : require('../../../assets/logo-mark.png')}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <Image
              source={scheme === 'dark' ? require('../../../assets/wordmark-white.png') : require('../../../assets/wordmark-green.png')}
              style={styles.headerWordmark}
              resizeMode="contain"
            />
          </View>
          <Pressable onPress={() => router.push('/(app)/household')} style={styles.familyButton} hitSlop={8}>
            <Ionicons name="home-outline" size={22} color={colors.inkSoft} />
          </Pressable>
        </View>

        {wasteTomorrow.length > 0 ? (
          <Pressable style={styles.wasteBanner} onPress={() => router.push('/(app)/waste')}>
            <Ionicons name="trash-outline" size={18} color={colors.danger} />
            <Text style={styles.wasteBannerText}>
              {t('overview.wasteTomorrow', { types: wasteTomorrowLabel })}
            </Text>
          </Pressable>
        ) : null}

        <SectionTitle>{t('overview.title')}</SectionTitle>

        <View style={styles.detailCard}>
          <Pressable style={styles.detailCardHeader} onPress={() => toggleCardCollapsed('avanzi')}>
            <View style={styles.detailCardHeaderLeft}>
              <Ionicons
                name={collapsedCards.has('avanzi') ? 'chevron-forward' : 'chevron-down'}
                size={16}
                color={colors.inkSoft}
              />
              <Text style={[styles.detailCardTitle, { color: colors.warn }]}>
                {t('overview.avanziCard.title')}
              </Text>
            </View>
            <Text style={[styles.detailCardCount, { color: colors.warn }]}>
              {avanziItems.length}
            </Text>
          </Pressable>
          {collapsedCards.has('avanzi') ? null : avanziItems.length === 0 ? (
            <Text style={styles.detailCardEmpty}>{t('overview.avanziCard.allGood')}</Text>
          ) : (
            <View style={styles.detailCardList}>
              {avanziItems.map((item) => {
                const cookedDaysAgo = item.purchaseDate ? -daysUntil(item.purchaseDate) : null;
                const cookedLabel =
                  cookedDaysAgo === null || cookedDaysAgo < 0
                    ? null
                    : cookedDaysAgo === 0
                      ? t('overview.avanziCard.cookedToday')
                      : t('overview.avanziCard.cookedDaysAgo', { n: cookedDaysAgo });
                return (
                  <Pressable key={item.id} style={styles.detailRow} onPress={() => goToItem(item)}>
                    <Text style={styles.detailRowText} numberOfLines={1}>{categoryEmoji(item.category)} {item.name}</Text>
                    {cookedLabel ? <Text style={styles.detailRowMeta}>{cookedLabel}</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.detailCard}>
          <Pressable style={styles.detailCardHeader} onPress={() => toggleCardCollapsed('opened')}>
            <View style={styles.detailCardHeaderLeft}>
              <Ionicons
                name={collapsedCards.has('opened') ? 'chevron-forward' : 'chevron-down'}
                size={16}
                color={colors.inkSoft}
              />
              <Text style={[styles.detailCardTitle, { color: colors.gold }]}>
                {t('overview.openedCard.title')}
              </Text>
            </View>
            <Text style={[styles.detailCardCount, { color: colors.gold }]}>
              {openedItems.length}
            </Text>
          </Pressable>
          {collapsedCards.has('opened') ? null : openedItems.length === 0 ? (
            <Text style={styles.detailCardEmpty}>{t('overview.openedCard.allGood')}</Text>
          ) : (
            <View style={styles.detailCardList}>
              {openedItems.map((item) => (
                <Pressable key={item.id} style={styles.detailRow} onPress={() => goToItem(item)}>
                  <Text style={styles.detailRowText} numberOfLines={1}>{categoryEmoji(item.category)} {item.name}</Text>
                  {item.openedDate ? (
                    <Text style={styles.detailRowMeta}>
                      {t('itemCard.openedOn', { date: formatShortDate(item.openedDate, language) })}
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={styles.detailCard}>
          <Pressable style={styles.detailCardHeader} onPress={() => toggleCardCollapsed('expiring')}>
            <View style={styles.detailCardHeaderLeft}>
              <Ionicons
                name={collapsedCards.has('expiring') ? 'chevron-forward' : 'chevron-down'}
                size={16}
                color={colors.inkSoft}
              />
              <Text style={[styles.detailCardTitle, { color: colors.danger }]}>
                {t('overview.expiringCard.title')}
              </Text>
            </View>
            <Text style={[styles.detailCardCount, { color: colors.danger }]}>
              {expiringItems.length}
            </Text>
          </Pressable>
          {collapsedCards.has('expiring') ? null : expiringItems.length === 0 ? (
            <Text style={styles.detailCardEmpty}>{t('overview.expiringCard.allGood')}</Text>
          ) : (
            <View style={styles.detailCardList}>
              {expiringItems.map((item) => {
                const info = getExpiryInfo(item.expirationDate, t, language);
                return (
                  <Pressable key={item.id} style={styles.detailRow} onPress={() => goToItem(item)}>
                    <Text style={styles.detailRowText} numberOfLines={1}>{categoryEmoji(item.category)} {item.name}</Text>
                    {info ? <Text style={styles.detailRowMeta}>{info.label}</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.detailCard}>
          <Pressable style={styles.detailCardHeader} onPress={() => toggleCardCollapsed('cleaning')}>
            <View style={styles.detailCardHeaderLeft}>
              <Ionicons
                name={collapsedCards.has('cleaning') ? 'chevron-forward' : 'chevron-down'}
                size={16}
                color={colors.inkSoft}
              />
              <Text style={[styles.detailCardTitle, { color: colors.info }]}>
                {t('overview.cleaningDueSection')}
              </Text>
            </View>
            <Text style={[styles.detailCardCount, { color: colors.info }]}>
              {overdueCleaning.length}
            </Text>
          </Pressable>
          {collapsedCards.has('cleaning') ? null : overdueCleaning.length === 0 ? (
            <Text style={styles.detailCardEmpty}>{t('overview.cleaningCard.allGood')}</Text>
          ) : (
            <View style={styles.detailCardList}>
              {overdueCleaning.map((task) => (
                <Pressable key={task.id} style={styles.detailRow} onPress={() => router.push('/(app)/cleaning')}>
                  <Text style={styles.detailRowText} numberOfLines={1}>{task.name}</Text>
                  <Text style={styles.detailRowMeta}>
                    {task.daysSinceCleaned === null
                      ? t('overview.cleaningNeverCleaned')
                      : t('overview.cleaningCleanedDaysAgo', { n: task.daysSinceCleaned })}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {shoppingCount > 0 && (
          <Pressable style={styles.shoppingLink} onPress={() => router.push('/(app)/(tabs)/shopping')}>
            <View style={styles.shoppingLinkLeft}>
              <Ionicons name="cart-outline" size={18} color={colors.brand} />
              <Text style={styles.shoppingLinkText}>{t('overview.shoppingLink', { n: shoppingCount })}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
          </Pressable>
        )}

        <SectionTitle small>{t('zone.title')}</SectionTitle>

        <View style={styles.zonesGrid}>
          {(summaryQuery.data ?? []).map((zone) => (
            <View key={zone.storageLocationId} style={styles.zoneCard}>
              <Pressable style={styles.zoneCardMain} onPress={() => goToZone(zone)}>
                <Text style={styles.zoneEmoji}>{zone.emoji}</Text>
                <Text style={styles.zoneName} numberOfLines={1}>{zone.name}</Text>
                <Text style={styles.zoneCount}>{zone.count}</Text>
                {(zone.hasOpened || zone.hasExpired || zone.hasExpiring) && (
                  <View style={styles.zoneDots}>
                    {zone.hasOpened && <View style={[styles.zoneDot, { backgroundColor: colors.gold }]} />}
                    {(zone.hasExpired || zone.hasExpiring) && (
                      <View style={[styles.zoneDot, { backgroundColor: colors.danger }]} />
                    )}
                  </View>
                )}
              </Pressable>
              <Pressable
                style={styles.zoneEditButton}
                hitSlop={8}
                onPress={() => router.push({ pathname: '/(app)/zone/[id]', params: { id: zone.storageLocationId } })}
              >
                <Ionicons name="pencil-outline" size={14} color={colors.inkSoft} />
              </Pressable>
            </View>
          ))}

          <Pressable style={styles.zoneAddCard} onPress={() => router.push('/(app)/zone/new')}>
            <Ionicons name="add-circle-outline" size={22} color={colors.brand} />
            <Text style={styles.zoneAddText}>{t('zone.add')}</Text>
          </Pressable>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.bg },
    flex: { flex: 1 },
    container: { padding: 20, gap: 16, paddingBottom: 120, ...webCentered },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerLogo: { width: 30, height: 30 },
    headerWordmark: { width: 88, height: 26 },
    familyButton: { padding: 2 },
    wasteBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: COLORS.dangerBg,
      borderRadius: 14,
      padding: 14,
    },
    wasteBannerText: { fontSize: 13, color: COLORS.ink, flexShrink: 1 },
    detailCard: {
      backgroundColor: COLORS.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.line,
      padding: 14,
      gap: 8,
    },
    detailCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    detailCardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
    detailCardTitle: { fontSize: 16, fontWeight: '800', color: COLORS.ink },
    detailCardCount: { fontSize: 20, fontWeight: '800', color: COLORS.ink },
    detailCardEmpty: { fontSize: 12, color: COLORS.inkSoft },
    detailCardList: { gap: 2 },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
      borderTopWidth: 1,
      borderColor: COLORS.line,
      paddingVertical: 8,
    },
    detailRowText: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.ink },
    detailRowMeta: { fontSize: 11, color: COLORS.inkSoft },
    shoppingLink: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: COLORS.card,
      borderRadius: 14,
      borderTopWidth: 2,
      borderStyle: 'dashed' as const,
      borderColor: COLORS.line,
      padding: 16,
    },
    shoppingLinkLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    shoppingLinkText: { fontSize: 13, fontWeight: '600', color: COLORS.ink },
    zonesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    zoneCard: {
      width: '31%',
      minWidth: 96,
      backgroundColor: COLORS.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.line,
      overflow: 'hidden',
    },
    zoneCardMain: { alignItems: 'center', gap: 2, paddingVertical: 14, paddingHorizontal: 6 },
    zoneEmoji: { fontSize: 22 },
    zoneName: { fontSize: 12, fontWeight: '700', color: COLORS.ink, maxWidth: '100%' },
    zoneCount: { fontSize: 11, color: COLORS.inkSoft },
    zoneDots: { position: 'absolute', top: 8, right: 8, flexDirection: 'row', gap: 4 },
    zoneDot: { width: 8, height: 8, borderRadius: 4 },
    zoneEditButton: {
      position: 'absolute',
      top: 6,
      left: 6,
      width: 22,
      height: 22,
      borderRadius: 11,
      alignItems: 'center',
      justifyContent: 'center',
    },
    zoneAddCard: {
      width: '31%',
      minWidth: 96,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderStyle: 'dashed' as const,
      borderColor: COLORS.brand,
    },
    zoneAddText: { fontSize: 11, fontWeight: '700', color: COLORS.brand, textAlign: 'center' },
  });
}

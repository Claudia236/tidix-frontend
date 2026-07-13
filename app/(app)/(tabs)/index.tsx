import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cleaningApi } from '../../../src/api/cleaning';
import { itemsApi } from '../../../src/api/items';
import { wasteApi } from '../../../src/api/waste';
import { AlertBanner } from '../../../src/components/AlertBanner';
import { EmptyState } from '../../../src/components/EmptyState';
import { SectionTitle } from '../../../src/components/SectionTitle';
import { jsWeekdayToDay, useWasteTypes, findWasteTypeInfo, wasteTypesCollectedOn } from '../../../src/constants/domain';
import { useI18n } from '../../../src/i18n/I18nContext';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';
import { webCentered } from '../../../src/theme/responsive';

export default function OverviewScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const wasteTypes = useWasteTypes();

  const summaryQuery = useQuery({ queryKey: ['items', 'summary'], queryFn: itemsApi.summary });
  const expiredQuery = useQuery({ queryKey: ['items', 'expired'], queryFn: itemsApi.expired });
  const expiringQuery = useQuery({ queryKey: ['items', 'expiring', 3], queryFn: () => itemsApi.expiring(3) });
  const shoppingQuery = useQuery({ queryKey: ['items', 'shopping-list'], queryFn: itemsApi.shoppingList });
  const cleaningQuery = useQuery({ queryKey: ['cleaning-tasks'], queryFn: cleaningApi.list });
  const wasteSchedulesQuery = useQuery({
    queryKey: ['waste-schedules'],
    queryFn: wasteApi.list,
    enabled: Platform.OS === 'web',
  });

  const totalCount = useMemo(
    () => (summaryQuery.data ?? []).reduce((sum, z) => sum + z.count, 0),
    [summaryQuery.data]
  );

  const overdueCleaning = useMemo(
    () => (cleaningQuery.data ?? []).filter((t) => t.overdue),
    [cleaningQuery.data]
  );

  const wasteTomorrow = useMemo(() => {
    if (Platform.OS !== 'web' || !wasteSchedulesQuery.data) return [];
    const tomorrow = jsWeekdayToDay((new Date().getDay() + 1) % 7);
    return wasteTypesCollectedOn(wasteSchedulesQuery.data, tomorrow);
  }, [wasteSchedulesQuery.data]);

  function refresh() {
    summaryQuery.refetch();
    expiredQuery.refetch();
    expiringQuery.refetch();
    shoppingQuery.refetch();
    cleaningQuery.refetch();
  }

  const expiredItems = expiredQuery.data ?? [];
  const expiringItems = expiringQuery.data ?? [];
  const shoppingCount = shoppingQuery.data?.length ?? 0;
  const zoneCount = summaryQuery.data?.length ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={summaryQuery.isFetching} onRefresh={refresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Logistica Domestica</Text>
          <Pressable onPress={() => router.push('/(app)/household')} style={styles.familyButton} hitSlop={8}>
            <Ionicons name="home-outline" size={22} color={colors.inkSoft} />
          </Pressable>
        </View>

        {wasteTomorrow.length > 0 ? (
          <Pressable style={styles.wasteBanner} onPress={() => router.push('/(app)/waste')}>
            <Ionicons name="trash-outline" size={18} color={colors.warn} />
            <Text style={styles.wasteBannerText}>
              {t('overview.wasteTomorrow', {
                types: wasteTomorrow.map((w) => findWasteTypeInfo(wasteTypes, w).label).join(', '),
              })}
            </Text>
          </Pressable>
        ) : null}

        <SectionTitle>{t('overview.title')}</SectionTitle>

        {totalCount === 0 ? (
          <EmptyState
            icon="cube-outline"
            title={t('overview.emptyTitle')}
            subtitle={t('overview.emptySubtitle')}
          />
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statTile}>
                <Text style={styles.statValue}>{totalCount}</Text>
                <Text style={styles.statLabel}>{t('overview.statProducts', { n: totalCount })}</Text>
              </View>
              <Pressable style={styles.statTile} onPress={() => router.push('/(app)/locations')}>
                <Text style={styles.statValue}>{zoneCount}</Text>
                <Text style={styles.statLabel}>{t('overview.statZones', { n: zoneCount })}</Text>
              </Pressable>
              <Pressable style={styles.statTile} onPress={() => router.push('/(app)/cleaning')}>
                <Text style={[styles.statValue, overdueCleaning.length > 0 && { color: colors.warn }]}>
                  {overdueCleaning.length}
                </Text>
                <Text style={styles.statLabel}>{t('overview.statCleaningDue')}</Text>
              </Pressable>
            </View>

            {expiredItems.length === 0 && expiringItems.length === 0 ? (
              <View style={styles.okBanner}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.brand} />
                <Text style={styles.okBannerText}>{t('overview.allGood')}</Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {expiredItems.length > 0 && (
                  <AlertBanner
                    tone="critico"
                    title={t('overview.expiredTitle', { n: expiredItems.length })}
                    items={expiredItems}
                    onItemPress={(item) => router.push({ pathname: '/(app)/item/[id]', params: { id: item.id } })}
                  />
                )}
                {expiringItems.length > 0 && (
                  <AlertBanner
                    tone="attenzione"
                    title={t('overview.expiringTitle', { n: expiringItems.length })}
                    items={expiringItems}
                    onItemPress={(item) => router.push({ pathname: '/(app)/item/[id]', params: { id: item.id } })}
                  />
                )}
              </View>
            )}

            {overdueCleaning.length > 0 && (
              <View style={styles.cleaningSection}>
                <SectionTitle small>{t('overview.cleaningDueSection')}</SectionTitle>
                {overdueCleaning.map((task) => (
                  <Pressable key={task.id} style={styles.cleaningRow} onPress={() => router.push('/(app)/cleaning')}>
                    <Ionicons name="sparkles-outline" size={16} color={colors.warn} />
                    <Text style={styles.cleaningRowText}>{task.name}</Text>
                    <Text style={styles.cleaningRowMeta}>
                      {task.daysSinceCleaned === null
                        ? t('overview.cleaningNeverCleaned')
                        : t('overview.cleaningCleanedDaysAgo', { n: task.daysSinceCleaned })}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {shoppingCount > 0 && (
              <Pressable style={styles.shoppingLink} onPress={() => router.push('/(app)/(tabs)/shopping')}>
                <View style={styles.shoppingLinkLeft}>
                  <Ionicons name="cart-outline" size={18} color={colors.brand} />
                  <Text style={styles.shoppingLinkText}>{t('overview.shoppingLink', { n: shoppingCount })}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.bg },
    container: { padding: 20, gap: 16, paddingBottom: 120, ...webCentered },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 17, fontWeight: '800', color: COLORS.ink },
    familyButton: { padding: 2 },
    okBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: COLORS.okBg,
      borderRadius: 14,
      padding: 14,
    },
    okBannerText: { fontSize: 13, color: COLORS.ink, flexShrink: 1 },
    wasteBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: COLORS.warnBg,
      borderRadius: 14,
      padding: 14,
    },
    wasteBannerText: { fontSize: 13, color: COLORS.ink, flexShrink: 1 },
    statsRow: { flexDirection: 'row', gap: 10 },
    statTile: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
      backgroundColor: COLORS.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.line,
      paddingVertical: 14,
    },
    statValue: { fontSize: 20, fontWeight: '800', color: COLORS.ink },
    statLabel: { fontSize: 11, color: COLORS.inkSoft, textAlign: 'center' },
    cleaningSection: { gap: 8 },
    cleaningRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: COLORS.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: COLORS.line,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    cleaningRowText: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.ink },
    cleaningRowMeta: { fontSize: 11, color: COLORS.inkSoft },
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
  });
}

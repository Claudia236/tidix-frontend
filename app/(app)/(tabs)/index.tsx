import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { itemsApi } from '../../../src/api/items';
import { wasteApi } from '../../../src/api/waste';
import { AlertBanner } from '../../../src/components/AlertBanner';
import { EmptyState } from '../../../src/components/EmptyState';
import { SectionTitle } from '../../../src/components/SectionTitle';
import { ZoneCard } from '../../../src/components/ZoneCard';
import { jsWeekdayToDay, wasteTypeInfo, wasteTypesCollectedOn } from '../../../src/constants/domain';
import { COLORS } from '../../../src/theme/colors';
import { webCentered } from '../../../src/theme/responsive';

export default function OverviewScreen() {
  const router = useRouter();

  const summaryQuery = useQuery({ queryKey: ['items', 'summary'], queryFn: itemsApi.summary });
  const expiredQuery = useQuery({ queryKey: ['items', 'expired'], queryFn: itemsApi.expired });
  const expiringQuery = useQuery({ queryKey: ['items', 'expiring', 3], queryFn: () => itemsApi.expiring(3) });
  const shoppingQuery = useQuery({ queryKey: ['items', 'shopping-list'], queryFn: itemsApi.shoppingList });
  const wasteSchedulesQuery = useQuery({
    queryKey: ['waste-schedules'],
    queryFn: wasteApi.list,
    enabled: Platform.OS === 'web',
  });

  const totalCount = useMemo(
    () => (summaryQuery.data ?? []).reduce((sum, z) => sum + z.count, 0),
    [summaryQuery.data]
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
  }

  function goToZone(storageLocationId: string) {
    router.push({ pathname: '/(app)/(tabs)/stock', params: { storageLocationId } });
  }

  const expiredItems = expiredQuery.data ?? [];
  const expiringItems = expiringQuery.data ?? [];
  const shoppingCount = shoppingQuery.data?.length ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={summaryQuery.isFetching} onRefresh={refresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Logistica Domestica</Text>
          <Pressable onPress={() => router.push('/(app)/household')} style={styles.familyButton} hitSlop={8}>
            <Ionicons name="home-outline" size={22} color={COLORS.inkSoft} />
          </Pressable>
        </View>

        {wasteTomorrow.length > 0 ? (
          <Pressable style={styles.wasteBanner} onPress={() => router.push('/(app)/waste')}>
            <Ionicons name="trash-outline" size={18} color={COLORS.warn} />
            <Text style={styles.wasteBannerText}>
              Domani passa: {wasteTomorrow.map((t) => wasteTypeInfo(t).label).join(', ')}. Ricordati il secchio stasera.
            </Text>
          </Pressable>
        ) : null}

        <SectionTitle>Panoramica</SectionTitle>

        {totalCount === 0 ? (
          <EmptyState
            icon="cube-outline"
            title="Inizia ad aggiungere i tuoi prodotti"
            subtitle="Tocca il pulsante + per registrare cosa hai in frigo, freezer, dispensa e sgabuzzino."
          />
        ) : (
          <>
            {expiredItems.length === 0 && expiringItems.length === 0 ? (
              <View style={styles.okBanner}>
                <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.brand} />
                <Text style={styles.okBannerText}>Nessuna scadenza imminente. Tutto sotto controllo.</Text>
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                {expiredItems.length > 0 && (
                  <AlertBanner
                    tone="critico"
                    title={`${expiredItems.length} prodott${expiredItems.length === 1 ? 'o' : 'i'} scadut${expiredItems.length === 1 ? 'o' : 'i'}`}
                    items={expiredItems}
                    onItemPress={(item) => router.push({ pathname: '/(app)/item/[id]', params: { id: item.id } })}
                  />
                )}
                {expiringItems.length > 0 && (
                  <AlertBanner
                    tone="attenzione"
                    title={`${expiringItems.length} prodott${expiringItems.length === 1 ? 'o' : 'i'} in scadenza`}
                    items={expiringItems}
                    onItemPress={(item) => router.push({ pathname: '/(app)/item/[id]', params: { id: item.id } })}
                  />
                )}
              </View>
            )}

            <View style={styles.zonesSection}>
              <SectionTitle small>Le zone</SectionTitle>
              <View style={styles.zonesGrid}>
                {(summaryQuery.data ?? []).map((summary) => (
                  <ZoneCard
                    key={summary.storageLocationId}
                    summary={summary}
                    onPress={() => goToZone(summary.storageLocationId)}
                  />
                ))}
              </View>
            </View>

            {shoppingCount > 0 && (
              <Pressable style={styles.shoppingLink} onPress={() => router.push('/(app)/(tabs)/shopping')}>
                <View style={styles.shoppingLinkLeft}>
                  <Ionicons name="cart-outline" size={18} color={COLORS.brand} />
                  <Text style={styles.shoppingLinkText}>
                    {shoppingCount} prodott{shoppingCount === 1 ? 'o' : 'i'} da comprare
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={COLORS.inkSoft} />
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  zonesSection: { gap: 8 },
  zonesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  shoppingLink: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderTopWidth: 2,
    borderStyle: 'dashed' as const,
    borderColor: COLORS.line,
    padding: 16,
  },
  shoppingLinkLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shoppingLinkText: { fontSize: 13, fontWeight: '600', color: COLORS.ink },
});

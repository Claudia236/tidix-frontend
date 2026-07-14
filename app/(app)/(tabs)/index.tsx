import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cleaningApi } from '../../../src/api/cleaning';
import { getErrorMessage } from '../../../src/api/client';
import { itemsApi } from '../../../src/api/items';
import { storageLocationsApi } from '../../../src/api/storageLocations';
import { wasteApi } from '../../../src/api/waste';
import { showAlert } from '../../../src/components/AppAlert';
import { EmptyState } from '../../../src/components/EmptyState';
import { PrimaryButton } from '../../../src/components/PrimaryButton';
import { SectionTitle } from '../../../src/components/SectionTitle';
import { jsWeekdayToDay, wasteTypesCollectedOn } from '../../../src/constants/domain';
import { useI18n } from '../../../src/i18n/I18nContext';
import { syncExpiryReminders } from '../../../src/notifications/expiryReminders';
import { syncWasteReminders } from '../../../src/notifications/wasteReminders';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';
import { webCentered } from '../../../src/theme/responsive';
import type { Item, ZoneSummary } from '../../../src/types';
import { formatShortDate, getExpiryInfo } from '../../../src/utils/expiry';

export default function OverviewScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, scheme } = useTheme();
  const { t, language } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const summaryQuery = useQuery({ queryKey: ['items', 'summary'], queryFn: itemsApi.summary });
  const expiredQuery = useQuery({ queryKey: ['items', 'expired'], queryFn: itemsApi.expired });
  const expiringQuery = useQuery({ queryKey: ['items', 'expiring', 3], queryFn: () => itemsApi.expiring(3) });
  const shoppingQuery = useQuery({ queryKey: ['items', 'shopping-list'], queryFn: itemsApi.shoppingList });
  const cleaningQuery = useQuery({ queryKey: ['cleaning-tasks'], queryFn: cleaningApi.list });
  const wasteSchedulesQuery = useQuery({ queryKey: ['waste-schedules'], queryFn: wasteApi.list });
  const allItemsQuery = useQuery({ queryKey: ['items', 'list', 'TUTTI', ''], queryFn: () => itemsApi.list({}) });

  const [addingZone, setAddingZone] = useState(false);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [zoneName, setZoneName] = useState('');
  const [zoneEmoji, setZoneEmoji] = useState('');

  function invalidateZones() {
    queryClient.invalidateQueries({ queryKey: ['storage-locations'] });
    queryClient.invalidateQueries({ queryKey: ['items', 'summary'] });
  }

  const saveZoneMutation = useMutation({
    mutationFn: () => {
      const input = { name: zoneName.trim(), emoji: zoneEmoji.trim() || undefined };
      return editingZoneId ? storageLocationsApi.update(editingZoneId, input) : storageLocationsApi.create(input);
    },
    onSuccess: () => {
      invalidateZones();
      closeZoneForm();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const removeZoneMutation = useMutation({
    mutationFn: (id: string) => storageLocationsApi.remove(id),
    onSuccess: () => {
      invalidateZones();
      closeZoneForm();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  function openAddZoneForm() {
    setEditingZoneId(null);
    setZoneName('');
    setZoneEmoji('');
    setAddingZone(true);
  }

  function openEditZoneForm(zone: ZoneSummary) {
    setEditingZoneId(zone.storageLocationId);
    setZoneName(zone.name);
    setZoneEmoji(zone.emoji);
    setAddingZone(true);
  }

  function closeZoneForm() {
    setAddingZone(false);
    setEditingZoneId(null);
  }

  function confirmDeleteZone() {
    if (!editingZoneId) return;
    showAlert(t('zone.confirmDeleteTitle'), t('zone.confirmDeleteMessage', { name: zoneName }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeZoneMutation.mutate(editingZoneId) },
    ]);
  }

  const totalCount = useMemo(
    () => (summaryQuery.data ?? []).reduce((sum, z) => sum + z.count, 0),
    [summaryQuery.data]
  );

  const overdueCleaning = useMemo(
    () => (cleaningQuery.data ?? []).filter((task) => task.overdue),
    [cleaningQuery.data]
  );

  const expiringItems = useMemo(() => {
    const combined = [...(expiredQuery.data ?? []), ...(expiringQuery.data ?? [])];
    return combined.sort((a, b) => (a.daysUntilExpiration ?? 0) - (b.daysUntilExpiration ?? 0));
  }, [expiredQuery.data, expiringQuery.data]);

  const openedItems = useMemo(() => (allItemsQuery.data ?? []).filter((i) => i.opened), [allItemsQuery.data]);

  const wasteTomorrow = useMemo(() => {
    if (Platform.OS !== 'web' || !wasteSchedulesQuery.data) return [];
    const tomorrow = jsWeekdayToDay((new Date().getDay() + 1) % 7);
    return wasteTypesCollectedOn(wasteSchedulesQuery.data, tomorrow);
  }, [wasteSchedulesQuery.data]);

  useEffect(() => {
    if (Platform.OS === 'web' || !expiringQuery.data) return;
    syncExpiryReminders(expiringQuery.data, t);
  }, [expiringQuery.data, t]);

  useEffect(() => {
    if (Platform.OS === 'web' || !wasteSchedulesQuery.data) return;
    syncWasteReminders(wasteSchedulesQuery.data, t);
  }, [wasteSchedulesQuery.data, t]);

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
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
              {t('overview.wasteTomorrow', {
                types: wasteTomorrow.map((w) => t(`wasteNotif.${w}`)).join(', '),
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
            <View style={styles.detailCard}>
              <View style={styles.detailCardHeader}>
                <Text style={styles.detailCardTitle}>{t('overview.openedCard.title')}</Text>
                <Text style={[styles.detailCardCount, openedItems.length > 0 && { color: colors.gold }]}>
                  {openedItems.length}
                </Text>
              </View>
              {openedItems.length === 0 ? (
                <Text style={styles.detailCardEmpty}>{t('overview.openedCard.allGood')}</Text>
              ) : (
                <View style={styles.detailCardList}>
                  {openedItems.map((item) => (
                    <Pressable key={item.id} style={styles.detailRow} onPress={() => goToItem(item)}>
                      <Text style={styles.detailRowText} numberOfLines={1}>{item.name}</Text>
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
              <View style={styles.detailCardHeader}>
                <Text style={styles.detailCardTitle}>{t('overview.expiringCard.title')}</Text>
                <Text style={[styles.detailCardCount, expiringItems.length > 0 && { color: colors.danger }]}>
                  {expiringItems.length}
                </Text>
              </View>
              {expiringItems.length === 0 ? (
                <Text style={styles.detailCardEmpty}>{t('overview.expiringCard.allGood')}</Text>
              ) : (
                <View style={styles.detailCardList}>
                  {expiringItems.map((item) => {
                    const info = getExpiryInfo(item.expirationDate, t, language);
                    return (
                      <Pressable key={item.id} style={styles.detailRow} onPress={() => goToItem(item)}>
                        <Text style={styles.detailRowText} numberOfLines={1}>{item.name}</Text>
                        {info ? <Text style={styles.detailRowMeta}>{info.label}</Text> : null}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>

            <View style={styles.detailCard}>
              <View style={styles.detailCardHeader}>
                <Text style={styles.detailCardTitle}>{t('overview.cleaningDueSection')}</Text>
                <Text style={[styles.detailCardCount, overdueCleaning.length > 0 && { color: colors.info }]}>
                  {overdueCleaning.length}
                </Text>
              </View>
              {overdueCleaning.length === 0 ? (
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
          </>
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
                onPress={() => openEditZoneForm(zone)}
              >
                <Ionicons name="pencil-outline" size={14} color={colors.inkSoft} />
              </Pressable>
            </View>
          ))}

          <Pressable style={styles.zoneAddCard} onPress={() => (addingZone && !editingZoneId ? closeZoneForm() : openAddZoneForm())}>
            <Ionicons name="add-circle-outline" size={22} color={colors.brand} />
            <Text style={styles.zoneAddText}>{t('zone.add')}</Text>
          </Pressable>
        </View>

        {addingZone ? (
          <View style={styles.zoneForm}>
            <View style={styles.zoneFormRow}>
              <TextInput
                value={zoneEmoji}
                onChangeText={(v) => setZoneEmoji(Array.from(v).slice(0, 1).join(''))}
                placeholder="📦"
                placeholderTextColor={colors.inkSoft}
                style={styles.zoneEmojiInput}
              />
              <TextInput
                value={zoneName}
                onChangeText={setZoneName}
                placeholder={t('zone.namePlaceholder')}
                placeholderTextColor={colors.inkSoft}
                style={styles.zoneNameInput}
                autoFocus
              />
            </View>
            <Text style={styles.zoneFormHint}>{t('zone.emojiHint')}</Text>
            <View style={styles.zoneFormActions}>
              <PrimaryButton
                label={editingZoneId ? t('common.saveChanges') : t('common.add')}
                onPress={() => saveZoneMutation.mutate()}
                disabled={!zoneName.trim()}
                loading={saveZoneMutation.isPending}
                style={{ flex: 1 }}
              />
              {editingZoneId ? (
                <Pressable style={styles.zoneDeleteButton} onPress={confirmDeleteZone} hitSlop={8}>
                  <Ionicons name="trash-outline" size={18} color={colors.danger} />
                </Pressable>
              ) : null}
            </View>
            <Pressable onPress={closeZoneForm}>
              <Text style={styles.zoneFormCancel}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
        ) : null}
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
    detailCardTitle: { fontSize: 13, fontWeight: '700', color: COLORS.ink },
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
    zoneForm: {
      gap: 10,
      backgroundColor: COLORS.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.line,
      padding: 16,
    },
    zoneFormRow: { flexDirection: 'row', gap: 8 },
    zoneEmojiInput: {
      width: 56,
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.bg,
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 8,
      fontSize: 18,
      textAlign: 'center',
    },
    zoneNameInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.bg,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 14,
      color: COLORS.ink,
    },
    zoneFormHint: { fontSize: 11, color: COLORS.inkSoft },
    zoneFormActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    zoneDeleteButton: {
      width: 44,
      height: 44,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: COLORS.dangerBg,
      backgroundColor: COLORS.dangerBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    zoneFormCancel: { fontSize: 12, fontWeight: '600', color: COLORS.inkSoft, textAlign: 'center' },
  });
}

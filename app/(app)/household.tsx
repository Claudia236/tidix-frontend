import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, Share, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getErrorMessage } from '../../src/api/client';
import { householdApi } from '../../src/api/household';
import { showAlert } from '../../src/components/AppAlert';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useCategories } from '../../src/constants/domain';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/i18n/I18nContext';
import type { Language } from '../../src/i18n/translations';
import {
  ensureNotificationPermissions,
  getNotificationPermissionStatus,
  setNotificationsEnabledPref,
  type NotificationPermissionStatus,
} from '../../src/notifications/core';
import type { ColorPalette } from '../../src/theme/colors';
import { useTheme, type ThemeMode } from '../../src/theme/ThemeContext';
import { webCentered } from '../../src/theme/responsive';
import type { Category } from '../../src/types';

const LANGUAGES: Language[] = ['it', 'en', 'es'];
const LANGUAGE_NATIVE_LABELS: Record<Language, string> = { it: 'Italiano', en: 'English', es: 'Español' };

export default function HouseholdScreen() {
  const { user, logout, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const { colors, mode, setMode } = useTheme();
  const { t, language, setLanguage } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const householdQuery = useQuery({ queryKey: ['household', 'me'], queryFn: householdApi.me });
  const categories = useCategories();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [notifStatus, setNotifStatus] = useState<NotificationPermissionStatus>('undetermined');

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') return;
      getNotificationPermissionStatus().then(setNotifStatus);
      // Non esiste piu' un interruttore in-app per le notifiche (l'unico
      // controllo reale e' il permesso del sistema operativo): ci si assicura
      // che la preferenza interna resti sempre attiva, cosi' chi l'aveva
      // disattivata quando esisteva ancora lo switch non resta bloccato.
      setNotificationsEnabledPref(true);
    }, [])
  );

  async function handleEnableNotifications() {
    if (notifStatus === 'denied') {
      Linking.openSettings();
      return;
    }
    await ensureNotificationPermissions();
    setNotifStatus(await getNotificationPermissionStatus());
  }

  const renameMutation = useMutation({
    mutationFn: (name: string) => householdApi.rename(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household', 'me'] });
      setEditingName(false);
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const leaveMutation = useMutation({
    mutationFn: () => householdApi.leave(),
    onSuccess: async () => {
      queryClient.clear();
      await refreshUser();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => householdApi.removeMember(memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['household', 'me'] }),
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const transferOwnershipMutation = useMutation({
    mutationFn: (memberId: string) => householdApi.transferOwnership(memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['household', 'me'] }),
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const updateCategoriesMutation = useMutation({
    mutationFn: (disabledCategories: Category[]) => householdApi.updateDisabledCategories(disabledCategories),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['household', 'me'] }),
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  function toggleCategoryEnabled(key: Category) {
    if (!householdQuery.data || key === 'ALTRO') return;
    const current = new Set(householdQuery.data.disabledCategories);
    if (current.has(key)) current.delete(key);
    else current.add(key);
    updateCategoriesMutation.mutate(Array.from(current));
  }

  async function shareInviteCode() {
    if (!householdQuery.data) return;
    await Share.share({
      message: t('household.shareMessage', { code: householdQuery.data.inviteCode }),
    });
  }

  function startEditingName() {
    setNameInput(householdQuery.data?.name ?? '');
    setEditingName(true);
  }

  function saveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    renameMutation.mutate(trimmed);
  }

  function handleLeavePress() {
    if (!householdQuery.data) return;
    const isOwner = householdQuery.data.ownerId === user?.id;

    if (isOwner && householdQuery.data.members.length > 1) {
      showAlert(t('household.cannotLeaveYetTitle'), t('household.cannotLeaveYetMessage'));
      return;
    }

    const message = isOwner
      ? t('household.leaveSoleMemberMessage')
      : t('household.leaveConfirmMessage', { name: householdQuery.data.name });

    showAlert(t('household.leaveFamily'), message, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('household.leaveButton'), style: 'destructive', onPress: () => leaveMutation.mutate() },
    ]);
  }

  function handleRemoveMember(memberId: string, memberName: string) {
    showAlert(t('household.removeMemberTitle'), t('household.removeMemberMessage', { name: memberName }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('household.removeButton'), style: 'destructive', onPress: () => removeMemberMutation.mutate(memberId) },
    ]);
  }

  function handleMakeAdmin(memberId: string, memberName: string) {
    showAlert(t('household.makeAdminTitle'), t('household.makeAdminMessage', { name: memberName }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('household.makeAdminButton'), onPress: () => transferOwnershipMutation.mutate(memberId) },
    ]);
  }

  if (householdQuery.isLoading || !householdQuery.data) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.brand} />
      </View>
    );
  }

  const household = householdQuery.data;
  const isOwner = household.ownerId === user?.id;

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 48 + insets.bottom }]}>
      {editingName ? (
        <View style={styles.nameEditRow}>
          <TextInput
            value={nameInput}
            onChangeText={setNameInput}
            placeholder={t('household.namePlaceholder')}
            placeholderTextColor={colors.inkSoft}
            style={styles.nameInput}
            autoFocus
            onSubmitEditing={saveName}
          />
          <Pressable onPress={saveName} style={styles.nameSaveButton} hitSlop={8}>
            <Ionicons name="checkmark" size={18} color={colors.white} />
          </Pressable>
          <Pressable onPress={() => setEditingName(false)} hitSlop={8}>
            <Ionicons name="close" size={20} color={colors.inkSoft} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.nameRow}>
          <Text style={styles.name}>{household.name}</Text>
          <Pressable onPress={startEditingName} hitSlop={8}>
            <Ionicons name="pencil-outline" size={18} color={colors.inkSoft} />
          </Pressable>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('household.inviteCodeLabel')}</Text>
        <Text style={styles.inviteCode}>{household.inviteCode}</Text>
        <Text style={styles.cardHint}>{t('household.inviteCodeHint')}</Text>
        <PrimaryButton label={t('household.shareCodeButton')} onPress={shareInviteCode} variant="secondary" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('household.membersLabel', { n: household.members.length })}</Text>
        {household.members.map((member) => (
          <View key={member.id} style={styles.member}>
            <View style={styles.memberRow}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {member.name}
                  {member.id === user?.id ? t('household.youSuffix') : ''}
                  {member.id === household.ownerId ? ' 👑' : ''}
                </Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
              </View>
              {isOwner && member.id !== user?.id ? (
                <View style={styles.memberActions}>
                  <Pressable
                    onPress={() => handleMakeAdmin(member.id, member.name)}
                    hitSlop={8}
                    style={styles.removeMemberButton}
                  >
                    <Ionicons name="ribbon-outline" size={18} color={colors.brand} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleRemoveMember(member.id, member.name)}
                    hitSlop={8}
                    style={styles.removeMemberButton}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('household.settingsTitle')}</Text>

        <View style={styles.settingsField}>
          <Text style={styles.settingsFieldLabel}>{t('household.languageLabel')}</Text>
          <View style={styles.chipRow}>
            {LANGUAGES.map((lang) => {
              const active = language === lang;
              return (
                <Pressable
                  key={lang}
                  onPress={() => setLanguage(lang)}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{LANGUAGE_NATIVE_LABELS[lang]}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.settingsField}>
          <Text style={styles.settingsFieldLabel}>{t('household.themeLabel')}</Text>
          <View style={styles.chipRow}>
            {(['light', 'dark'] as ThemeMode[]).map((m) => {
              const active = mode === m;
              const label = m === 'light' ? t('household.themeLight') : t('household.themeDark');
              return (
                <Pressable key={m} onPress={() => setMode(m)} style={[styles.chip, active && styles.chipActive]}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.settingsField}>
          <Text style={styles.settingsFieldLabel}>{t('household.notificationsLabel')}</Text>
          {Platform.OS !== 'web' ? (
            <>
              <Text style={styles.cardHint}>{t('household.notificationsHint')}</Text>
              <Text style={[styles.notifStatusText, notifStatus === 'denied' && { color: colors.danger }]}>
                {notifStatus === 'denied'
                  ? t('household.notificationsDenied')
                  : notifStatus === 'granted'
                    ? t('household.notificationsGranted')
                    : t('household.notificationsUndetermined')}
              </Text>
              {notifStatus !== 'granted' ? (
                <PrimaryButton
                  label={
                    notifStatus === 'denied'
                      ? t('household.notificationsOpenSettingsButton')
                      : t('household.notificationsEnableButton')
                  }
                  onPress={handleEnableNotifications}
                  variant="secondary"
                />
              ) : null}
            </>
          ) : (
            <Text style={styles.cardHint}>{t('household.notificationsWebHint')}</Text>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>{t('household.categoriesTitle')}</Text>
        <Text style={styles.cardHint}>{t('household.categoriesHint')}</Text>
        <View style={styles.categoryList}>
          {categories.map((cat) => {
            const isAltro = cat.key === 'ALTRO';
            const enabled = isAltro || !(householdQuery.data.disabledCategories ?? []).includes(cat.key);
            return (
              <View key={cat.key} style={styles.categoryRow}>
                <Text style={styles.categoryRowLabel}>
                  {cat.emoji} {cat.label}
                </Text>
                <Switch
                  value={enabled}
                  onValueChange={() => toggleCategoryEnabled(cat.key)}
                  disabled={isAltro}
                  trackColor={{ false: colors.line, true: colors.brand }}
                  thumbColor={colors.white}
                />
              </View>
            );
          })}
        </View>
      </View>

      <PrimaryButton label={t('household.leaveFamily')} variant="secondary" onPress={handleLeavePress} />
      <PrimaryButton label={t('household.leaveAccount')} variant="danger" onPress={logout} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    content: { padding: 20, gap: 16, paddingBottom: 48, ...webCentered },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    name: { fontSize: 20, fontWeight: '800', color: COLORS.ink },
    nameEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    nameInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 16,
      fontWeight: '700',
      color: COLORS.ink,
    },
    nameSaveButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: COLORS.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
      backgroundColor: COLORS.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.line,
      padding: 16,
      gap: 10,
    },
    cardLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, color: COLORS.inkSoft },
    inviteCode: { fontSize: 28, fontWeight: '800', color: COLORS.brand, letterSpacing: 4 },
    cardHint: { fontSize: 12, color: COLORS.inkSoft },
    member: { borderTopWidth: 1, borderColor: COLORS.line, paddingTop: 8, marginTop: 4 },
    memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
    memberEmail: { fontSize: 12, color: COLORS.inkSoft },
    memberActions: { flexDirection: 'row', alignItems: 'center' },
    removeMemberButton: { padding: 4, marginRight: 8 },
    settingsField: { gap: 8 },
    settingsFieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.ink },
    notifStatusText: { fontSize: 12, color: COLORS.inkSoft },
    categoryList: { gap: 2 },
    categoryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderColor: COLORS.line,
      paddingVertical: 10,
    },
    categoryRowLabel: { fontSize: 13, color: COLORS.ink, flex: 1, marginRight: 8 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    chipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
    chipText: { fontSize: 12, fontWeight: '600', color: COLORS.ink },
    chipTextActive: { color: COLORS.white },
  });
}

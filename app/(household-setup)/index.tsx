import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getErrorMessage } from '../../src/api/client';
import { householdApi } from '../../src/api/household';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { TextField } from '../../src/components/TextField';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/i18n/I18nContext';
import type { ColorPalette } from '../../src/theme/colors';
import { useTheme } from '../../src/theme/ThemeContext';
import { webCentered } from '../../src/theme/responsive';

type Mode = 'choose' | 'create' | 'join';

export default function HouseholdSetupScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [mode, setMode] = useState<Mode>('choose');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleCreate() {
    setError(null);
    setSubmitting(true);
    try {
      await householdApi.create(name.trim());
      await refreshUser();
    } catch (e) {
      setError(getErrorMessage(e, t));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoin() {
    setError(null);
    setSubmitting(true);
    try {
      await householdApi.join(inviteCode.trim().toUpperCase());
      await refreshUser();
    } catch (e) {
      setError(getErrorMessage(e, t));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{t('householdSetup.greeting', { name: user?.name ?? '' })}</Text>
        <Text style={styles.subtitle}>{t('householdSetup.subtitle')}</Text>

        {mode === 'choose' && (
          <View style={styles.choices}>
            <Pressable style={styles.choiceCard} onPress={() => setMode('create')}>
              <Text style={styles.choiceTitle}>{t('householdSetup.createTitle')}</Text>
              <Text style={styles.choiceSubtitle}>{t('householdSetup.createSubtitle')}</Text>
            </Pressable>
            <Pressable style={styles.choiceCard} onPress={() => setMode('join')}>
              <Text style={styles.choiceTitle}>{t('householdSetup.joinTitle')}</Text>
              <Text style={styles.choiceSubtitle}>{t('householdSetup.joinSubtitle')}</Text>
            </Pressable>
          </View>
        )}

        {mode === 'create' && (
          <View style={styles.form}>
            <TextField label={t('householdSetup.householdNameLabel')} placeholder={t('householdSetup.householdNamePlaceholder')} value={name} onChangeText={setName} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton label={t('householdSetup.createButton')} onPress={handleCreate} loading={submitting} disabled={!name.trim()} />
            <PrimaryButton label={t('householdSetup.back')} variant="secondary" onPress={() => setMode('choose')} />
          </View>
        )}

        {mode === 'join' && (
          <View style={styles.form}>
            <TextField
              label={t('household.inviteCodeLabel')}
              placeholder={t('householdSetup.inviteCodePlaceholder')}
              autoCapitalize="characters"
              value={inviteCode}
              onChangeText={setInviteCode}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton label={t('householdSetup.joinButton')} onPress={handleJoin} loading={submitting} disabled={!inviteCode.trim()} />
            <PrimaryButton label={t('householdSetup.back')} variant="secondary" onPress={() => setMode('choose')} />
          </View>
        )}

        <Pressable onPress={logout} style={styles.logout}>
          <Text style={styles.logoutText}>{t('householdSetup.logout')}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: COLORS.bg },
    container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 20, ...webCentered },
    title: { fontSize: 22, fontWeight: '800', color: COLORS.ink, textAlign: 'center' },
    subtitle: { fontSize: 14, color: COLORS.inkSoft, textAlign: 'center' },
    choices: { gap: 12, marginTop: 8 },
    choiceCard: {
      backgroundColor: COLORS.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.line,
      padding: 16,
    },
    choiceTitle: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
    choiceSubtitle: { fontSize: 13, color: COLORS.inkSoft, marginTop: 4 },
    form: { gap: 12, marginTop: 8 },
    error: { color: COLORS.danger, fontSize: 13 },
    logout: { alignItems: 'center', marginTop: 24 },
    logoutText: { color: COLORS.inkSoft, fontWeight: '600' },
  });
}

import { Link, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { authApi } from '../../src/api/auth';
import { getErrorMessage } from '../../src/api/client';
import { PasswordField } from '../../src/components/PasswordField';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { TextField } from '../../src/components/TextField';
import { useI18n } from '../../src/i18n/I18nContext';
import type { ColorPalette } from '../../src/theme/colors';
import { useTheme } from '../../src/theme/ThemeContext';
import { webCentered } from '../../src/theme/responsive';

type Step = 'request' | 'reset';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleRequestCode() {
    setError(null);
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setInfo(t('auth.forgot.infoSent'));
      setStep('reset');
    } catch (e) {
      setError(getErrorMessage(e, t));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword() {
    setError(null);
    setSubmitting(true);
    try {
      await authApi.resetPassword(email.trim(), code.trim(), newPassword);
      router.replace('/(auth)/login');
    } catch (e) {
      setError(getErrorMessage(e, t));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>{t('auth.forgot.title')}</Text>
        <Text style={styles.subtitle}>
          {step === 'request' ? t('auth.forgot.subtitleRequest') : t('auth.forgot.subtitleReset')}
        </Text>

        {step === 'request' ? (
          <View style={styles.form}>
            <TextField
              label={t('auth.emailLabel')}
              placeholder={t('auth.emailPlaceholder')}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton label={t('auth.forgot.sendCodeButton')} onPress={handleRequestCode} loading={submitting} disabled={!email} />
          </View>
        ) : (
          <View style={styles.form}>
            {info ? <Text style={styles.info}>{info}</Text> : null}
            <TextField
              label={t('auth.forgot.codeLabel')}
              placeholder="123456"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
            />
            <PasswordField
              label={t('auth.forgot.newPasswordLabel')}
              placeholder={t('auth.passwordMinPlaceholder')}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton
              label={t('auth.forgot.resetButton')}
              onPress={handleResetPassword}
              loading={submitting}
              disabled={!code || newPassword.length < 8}
            />
            <PrimaryButton label={t('auth.forgot.retryButton')} variant="secondary" onPress={() => setStep('request')} />
          </View>
        )}

        <Link href="/(auth)/login" style={styles.link}>
          {t('auth.forgot.backToLogin')}
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: COLORS.bg },
    container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24, ...webCentered },
    logo: { fontSize: 22, fontWeight: '800', color: COLORS.ink, textAlign: 'center' },
    subtitle: { fontSize: 14, color: COLORS.inkSoft, textAlign: 'center' },
    form: { gap: 16 },
    error: { color: COLORS.danger, fontSize: 13 },
    info: { color: COLORS.brand, fontSize: 13 },
    link: { textAlign: 'center', color: COLORS.brand, fontWeight: '600', marginTop: 8 },
  });
}

import { Link } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getErrorMessage } from '../../src/api/client';
import { PasswordField } from '../../src/components/PasswordField';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { TextField } from '../../src/components/TextField';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/i18n/I18nContext';
import type { ColorPalette } from '../../src/theme/colors';
import { useTheme } from '../../src/theme/ThemeContext';
import { webCentered } from '../../src/theme/responsive';

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors, scheme } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(getErrorMessage(e, t));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior="padding">
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Image
            source={scheme === 'dark' ? require('../../assets/logo-mark-white.png') : require('../../assets/logo-mark.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <Image
            source={scheme === 'dark' ? require('../../assets/wordmark-white.png') : require('../../assets/wordmark-green.png')}
            style={styles.brandWordmark}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>

        <View style={styles.form}>
          <TextField
            label={t('auth.emailLabel')}
            placeholder={t('auth.emailPlaceholder')}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <PasswordField
            label={t('auth.passwordLabel')}
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
          />
          <Link href="/(auth)/forgot-password" style={styles.forgotLink}>
            {t('auth.forgotPasswordLink')}
          </Link>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton label={t('auth.loginButton')} onPress={handleSubmit} loading={submitting} disabled={!email || !password} />
        </View>

        <Link href="/(auth)/register" style={styles.link}>
          {t('auth.noAccountLink')}
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: COLORS.bg },
    container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24, ...webCentered },
    brand: { alignItems: 'center', gap: 8 },
    brandLogo: { width: 72, height: 72 },
    brandWordmark: { width: 176, height: 55 },
    subtitle: { fontSize: 14, color: COLORS.inkSoft, textAlign: 'center' },
    form: { gap: 16 },
    error: { color: COLORS.danger, fontSize: 13 },
    link: { textAlign: 'center', color: COLORS.brand, fontWeight: '600', marginTop: 8 },
    forgotLink: { textAlign: 'right', color: COLORS.inkSoft, fontSize: 12, fontWeight: '600', marginTop: -8 },
  });
}

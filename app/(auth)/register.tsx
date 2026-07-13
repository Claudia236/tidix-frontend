import { Link } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getErrorMessage } from '../../src/api/client';
import { PasswordField } from '../../src/components/PasswordField';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { TextField } from '../../src/components/TextField';
import { useAuth } from '../../src/context/AuthContext';
import { useI18n } from '../../src/i18n/I18nContext';
import type { ColorPalette } from '../../src/theme/colors';
import { useTheme } from '../../src/theme/ThemeContext';
import { webCentered } from '../../src/theme/responsive';

export default function RegisterScreen() {
  const { register } = useAuth();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await register(name.trim(), email.trim(), password);
    } catch (e) {
      setError(getErrorMessage(e, t));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>{t('auth.register.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.register.subtitle')}</Text>

        <View style={styles.form}>
          <TextField label={t('auth.nameLabel')} placeholder={t('auth.namePlaceholder')} value={name} onChangeText={setName} />
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
            placeholder={t('auth.passwordMinPlaceholder')}
            value={password}
            onChangeText={setPassword}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton
            label={t('auth.registerButton')}
            onPress={handleSubmit}
            loading={submitting}
            disabled={!name || !email || password.length < 8}
          />
        </View>

        <Link href="/(auth)/login" style={styles.link}>
          {t('auth.haveAccountLink')}
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
    link: { textAlign: 'center', color: COLORS.brand, fontWeight: '600', marginTop: 8 },
  });
}

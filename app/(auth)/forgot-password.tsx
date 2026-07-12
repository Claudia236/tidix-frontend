import { Link, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { authApi } from '../../src/api/auth';
import { getErrorMessage } from '../../src/api/client';
import { PasswordField } from '../../src/components/PasswordField';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { TextField } from '../../src/components/TextField';
import { COLORS } from '../../src/theme/colors';
import { webCentered } from '../../src/theme/responsive';

type Step = 'request' | 'reset';

export default function ForgotPasswordScreen() {
  const router = useRouter();
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
      setInfo('Se l\'indirizzo esiste, ti abbiamo inviato un codice via email. Controlla anche lo spam.');
      setStep('reset');
    } catch (e) {
      setError(getErrorMessage(e));
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
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>Password dimenticata</Text>
        <Text style={styles.subtitle}>
          {step === 'request'
            ? 'Inserisci la tua email: ti mandiamo un codice per reimpostare la password.'
            : 'Inserisci il codice ricevuto via email e la nuova password.'}
        </Text>

        {step === 'request' ? (
          <View style={styles.form}>
            <TextField
              label="Email"
              placeholder="nome@esempio.it"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton label="Invia codice" onPress={handleRequestCode} loading={submitting} disabled={!email} />
          </View>
        ) : (
          <View style={styles.form}>
            {info ? <Text style={styles.info}>{info}</Text> : null}
            <TextField
              label="Codice ricevuto via email"
              placeholder="123456"
              keyboardType="number-pad"
              value={code}
              onChangeText={setCode}
            />
            <PasswordField
              label="Nuova password"
              placeholder="Almeno 8 caratteri"
              value={newPassword}
              onChangeText={setNewPassword}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton
              label="Reimposta password"
              onPress={handleResetPassword}
              loading={submitting}
              disabled={!code || newPassword.length < 8}
            />
            <PrimaryButton label="Non ho ricevuto il codice, riprova" variant="secondary" onPress={() => setStep('request')} />
          </View>
        )}

        <Link href="/(auth)/login" style={styles.link}>
          Torna al login
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24, ...webCentered },
  logo: { fontSize: 22, fontWeight: '800', color: COLORS.ink, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.inkSoft, textAlign: 'center' },
  form: { gap: 16 },
  error: { color: COLORS.danger, fontSize: 13 },
  info: { color: COLORS.brand, fontSize: 13 },
  link: { textAlign: 'center', color: COLORS.brand, fontWeight: '600', marginTop: 8 },
});

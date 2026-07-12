import { Link } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getErrorMessage } from '../../src/api/client';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { TextField } from '../../src/components/TextField';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/theme/colors';

export default function RegisterScreen() {
  const { register } = useAuth();
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
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>Crea il tuo account</Text>
        <Text style={styles.subtitle}>Dopo la registrazione potrai creare una famiglia o unirti a quella di un familiare</Text>

        <View style={styles.form}>
          <TextField label="Nome" placeholder="Il tuo nome" value={name} onChangeText={setName} />
          <TextField
            label="Email"
            placeholder="nome@esempio.it"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextField
            label="Password"
            placeholder="Almeno 8 caratteri"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton
            label="Registrati"
            onPress={handleSubmit}
            loading={submitting}
            disabled={!name || !email || password.length < 8}
          />
        </View>

        <Link href="/(auth)/login" style={styles.link}>
          Hai già un account? Accedi
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24 },
  logo: { fontSize: 22, fontWeight: '800', color: COLORS.ink, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.inkSoft, textAlign: 'center' },
  form: { gap: 16 },
  error: { color: COLORS.danger, fontSize: 13 },
  link: { textAlign: 'center', color: COLORS.brand, fontWeight: '600', marginTop: 8 },
});

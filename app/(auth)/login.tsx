import { Link } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getErrorMessage } from '../../src/api/client';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { TextField } from '../../src/components/TextField';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/theme/colors';

export default function LoginScreen() {
  const { login } = useAuth();
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
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>Logistica Domestica</Text>
        <Text style={styles.subtitle}>Accedi per vedere l'inventario della tua famiglia</Text>

        <View style={styles.form}>
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
            placeholder="••••••••"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <PrimaryButton label="Accedi" onPress={handleSubmit} loading={submitting} disabled={!email || !password} />
        </View>

        <Link href="/(auth)/register" style={styles.link}>
          Non hai un account? Registrati
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 24 },
  logo: { fontSize: 24, fontWeight: '800', color: COLORS.ink, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.5 },
  subtitle: { fontSize: 14, color: COLORS.inkSoft, textAlign: 'center' },
  form: { gap: 16 },
  error: { color: COLORS.danger, fontSize: 13 },
  link: { textAlign: 'center', color: COLORS.brand, fontWeight: '600', marginTop: 8 },
});

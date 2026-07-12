import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getErrorMessage } from '../../src/api/client';
import { householdApi } from '../../src/api/household';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { TextField } from '../../src/components/TextField';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/theme/colors';
import { webCentered } from '../../src/theme/responsive';

type Mode = 'choose' | 'create' | 'join';

export default function HouseholdSetupScreen() {
  const { user, logout, refreshUser } = useAuth();
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
      setError(getErrorMessage(e));
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
      setError(getErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Ciao {user?.name}!</Text>
        <Text style={styles.subtitle}>
          Per iniziare, crea una nuova famiglia oppure unisciti a quella di un familiare con un codice invito.
        </Text>

        {mode === 'choose' && (
          <View style={styles.choices}>
            <Pressable style={styles.choiceCard} onPress={() => setMode('create')}>
              <Text style={styles.choiceTitle}>Crea una famiglia</Text>
              <Text style={styles.choiceSubtitle}>Genera un codice invito da condividere</Text>
            </Pressable>
            <Pressable style={styles.choiceCard} onPress={() => setMode('join')}>
              <Text style={styles.choiceTitle}>Unisciti con un codice</Text>
              <Text style={styles.choiceSubtitle}>Hai già un codice invito di un familiare</Text>
            </Pressable>
          </View>
        )}

        {mode === 'create' && (
          <View style={styles.form}>
            <TextField label="Nome famiglia" placeholder="Es. Famiglia Rossi" value={name} onChangeText={setName} />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton label="Crea famiglia" onPress={handleCreate} loading={submitting} disabled={!name.trim()} />
            <PrimaryButton label="Indietro" variant="secondary" onPress={() => setMode('choose')} />
          </View>
        )}

        {mode === 'join' && (
          <View style={styles.form}>
            <TextField
              label="Codice invito"
              placeholder="Es. AB12CD"
              autoCapitalize="characters"
              value={inviteCode}
              onChangeText={setInviteCode}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton label="Unisciti" onPress={handleJoin} loading={submitting} disabled={!inviteCode.trim()} />
            <PrimaryButton label="Indietro" variant="secondary" onPress={() => setMode('choose')} />
          </View>
        )}

        <Pressable onPress={logout} style={styles.logout}>
          <Text style={styles.logoutText}>Esci</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.bg },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 20, ...webCentered },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.ink, textAlign: 'center' },
  subtitle: { fontSize: 14, color: COLORS.inkSoft, textAlign: 'center' },
  choices: { gap: 12, marginTop: 8 },
  choiceCard: {
    backgroundColor: COLORS.white,
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

import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native';
import { getErrorMessage } from '../../src/api/client';
import { householdApi } from '../../src/api/household';
import { showAlert } from '../../src/components/AppAlert';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/theme/colors';
import { webCentered } from '../../src/theme/responsive';

export default function HouseholdScreen() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const householdQuery = useQuery({ queryKey: ['household', 'me'], queryFn: householdApi.me });

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const renameMutation = useMutation({
    mutationFn: (name: string) => householdApi.rename(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['household', 'me'] });
      setEditingName(false);
    },
    onError: (e) => showAlert('Errore', getErrorMessage(e)),
  });

  async function shareInviteCode() {
    if (!householdQuery.data) return;
    await Share.share({
      message: `Unisciti alla nostra famiglia su Logistica Domestica! Codice invito: ${householdQuery.data.inviteCode}`,
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

  if (householdQuery.isLoading || !householdQuery.data) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.brand} />
      </View>
    );
  }

  const household = householdQuery.data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {editingName ? (
        <View style={styles.nameEditRow}>
          <TextInput
            value={nameInput}
            onChangeText={setNameInput}
            placeholder="Nome famiglia"
            placeholderTextColor={COLORS.inkSoft}
            style={styles.nameInput}
            autoFocus
            onSubmitEditing={saveName}
          />
          <Pressable onPress={saveName} style={styles.nameSaveButton} hitSlop={8}>
            <Ionicons name="checkmark" size={18} color={COLORS.white} />
          </Pressable>
          <Pressable onPress={() => setEditingName(false)} hitSlop={8}>
            <Ionicons name="close" size={20} color={COLORS.inkSoft} />
          </Pressable>
        </View>
      ) : (
        <View style={styles.nameRow}>
          <Text style={styles.name}>{household.name}</Text>
          <Pressable onPress={startEditingName} hitSlop={8}>
            <Ionicons name="pencil-outline" size={18} color={COLORS.inkSoft} />
          </Pressable>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Codice invito</Text>
        <Text style={styles.inviteCode}>{household.inviteCode}</Text>
        <Text style={styles.cardHint}>Condividi questo codice con un familiare per farlo entrare nella famiglia.</Text>
        <PrimaryButton label="Condividi codice" onPress={shareInviteCode} variant="secondary" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Membri ({household.members.length})</Text>
        {household.members.map((member) => (
          <View key={member.id} style={styles.member}>
            <Text style={styles.memberName}>
              {member.name}
              {member.id === user?.id ? ' (tu)' : ''}
            </Text>
            <Text style={styles.memberEmail}>{member.email}</Text>
          </View>
        ))}
      </View>

      <PrimaryButton label="Esci dall'account" variant="danger" onPress={logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: COLORS.white,
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
    backgroundColor: COLORS.white,
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
  memberName: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
  memberEmail: { fontSize: 12, color: COLORS.inkSoft },
});

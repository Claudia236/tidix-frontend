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
  const { user, logout, refreshUser } = useAuth();
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

  const leaveMutation = useMutation({
    mutationFn: () => householdApi.leave(),
    onSuccess: async () => {
      queryClient.clear();
      await refreshUser();
    },
    onError: (e) => showAlert('Errore', getErrorMessage(e)),
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => householdApi.removeMember(memberId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['household', 'me'] }),
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

  function handleLeavePress() {
    if (!householdQuery.data) return;
    const isOwner = householdQuery.data.ownerId === user?.id;

    if (isOwner && householdQuery.data.members.length > 1) {
      showAlert(
        'Non puoi ancora uscire',
        'Sei il creatore della famiglia: rimuovi prima tutti gli altri membri per poter uscire.'
      );
      return;
    }

    const message = isOwner
      ? 'Sei l\'unico membro rimasto: uscendo, la famiglia e tutti i suoi dati verranno eliminati definitivamente. Continuare?'
      : `Sei sicuro di voler uscire dalla famiglia "${householdQuery.data.name}"?`;

    showAlert('Esci dalla famiglia', message, [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Esci', style: 'destructive', onPress: () => leaveMutation.mutate() },
    ]);
  }

  function handleRemoveMember(memberId: string, memberName: string) {
    showAlert('Rimuovi membro', `Rimuovere ${memberName} dalla famiglia?`, [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Rimuovi', style: 'destructive', onPress: () => removeMemberMutation.mutate(memberId) },
    ]);
  }

  if (householdQuery.isLoading || !householdQuery.data) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={COLORS.brand} />
      </View>
    );
  }

  const household = householdQuery.data;
  const isOwner = household.ownerId === user?.id;

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
            <View style={styles.memberRow}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {member.name}
                  {member.id === user?.id ? ' (tu)' : ''}
                  {member.id === household.ownerId ? ' 👑' : ''}
                </Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
              </View>
              {isOwner && member.id !== user?.id ? (
                <Pressable
                  onPress={() => handleRemoveMember(member.id, member.name)}
                  hitSlop={8}
                  style={styles.removeMemberButton}
                >
                  <Ionicons name="person-remove-outline" size={18} color={COLORS.danger} />
                </Pressable>
              ) : null}
            </View>
          </View>
        ))}
      </View>

      <PrimaryButton label="Esci dalla famiglia" variant="secondary" onPress={handleLeavePress} />
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
  memberRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
  memberEmail: { fontSize: 12, color: COLORS.inkSoft },
  removeMemberButton: { padding: 4 },
});

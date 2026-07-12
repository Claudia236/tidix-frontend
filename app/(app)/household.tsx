import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { householdApi } from '../../src/api/household';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/theme/colors';

export default function HouseholdScreen() {
  const { user, logout } = useAuth();
  const householdQuery = useQuery({ queryKey: ['household', 'me'], queryFn: householdApi.me });

  async function shareInviteCode() {
    if (!householdQuery.data) return;
    await Share.share({
      message: `Unisciti alla nostra famiglia su Logistica Domestica! Codice invito: ${householdQuery.data.inviteCode}`,
    });
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
      <Text style={styles.name}>{household.name}</Text>

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
  content: { padding: 20, gap: 16, paddingBottom: 48 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  name: { fontSize: 20, fontWeight: '800', color: COLORS.ink },
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

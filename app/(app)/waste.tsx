import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { getErrorMessage } from '../../src/api/client';
import { householdApi } from '../../src/api/household';
import { wasteApi } from '../../src/api/waste';
import { EmptyState } from '../../src/components/EmptyState';
import { WASTE_TYPES, wasteTypeInfo } from '../../src/constants/domain';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS } from '../../src/theme/colors';
import { webCentered } from '../../src/theme/responsive';
import type { WasteLog } from '../../src/types';

export default function WasteScreen() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const logsQuery = useQuery({ queryKey: ['waste-logs'], queryFn: () => wasteApi.recent(14) });
  const householdQuery = useQuery({ queryKey: ['household', 'me'], queryFn: householdApi.me });

  const memberName = useMemo(() => {
    const map = new Map((householdQuery.data?.members ?? []).map((m) => [m.id, m.name]));
    return (userId: string) => (userId === user?.id ? 'Tu' : map.get(userId) ?? 'Un familiare');
  }, [householdQuery.data, user?.id]);

  const createMutation = useMutation({
    mutationFn: (type: WasteLog['type']) => wasteApi.create(type),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waste-logs'] }),
    onError: (e) => Alert.alert('Rifiuti', getErrorMessage(e)),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => wasteApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['waste-logs'] }),
    onError: (e) => Alert.alert('Errore', getErrorMessage(e)),
  });

  const logs = logsQuery.data ?? [];

  return (
    <View style={styles.container}>
      <View style={[styles.quickSection, webCentered]}>
        <Text style={styles.quickLabel}>Segna la raccolta di oggi</Text>
        <View style={styles.quickGrid}>
          {WASTE_TYPES.map((w) => (
            <Pressable key={w.key} onPress={() => createMutation.mutate(w.key)} style={styles.quickChip}>
              <Text style={{ fontSize: 16 }}>{w.emoji}</Text>
              <Text style={styles.quickChipText}>{w.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={logs}
        keyExtractor={(l) => l.id}
        contentContainerStyle={[styles.list, webCentered]}
        ListEmptyComponent={
          <EmptyState
            icon="trash-outline"
            title="Nessuna raccolta registrata"
            subtitle="Tocca un tipo di rifiuto qui sopra per segnare la raccolta di oggi."
          />
        }
        renderItem={({ item }) => {
          const info = wasteTypeInfo(item.type);
          return (
            <View style={styles.row}>
              <Text style={{ fontSize: 18 }}>{info.emoji}</Text>
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>{info.label}</Text>
                <Text style={styles.rowSubtitle}>
                  {item.date} · {memberName(item.doneByUserId)}
                </Text>
              </View>
              <Pressable onPress={() => removeMutation.mutate(item.id)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={COLORS.inkSoft} />
              </Pressable>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingTop: 16 },
  quickSection: { paddingHorizontal: 20, gap: 10 },
  quickLabel: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4, color: COLORS.inkSoft },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  quickChipText: { fontSize: 12, fontWeight: '600', color: COLORS.ink },
  list: { padding: 20, paddingTop: 16, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
  },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
  rowSubtitle: { fontSize: 12, color: COLORS.inkSoft, marginTop: 2 },
});

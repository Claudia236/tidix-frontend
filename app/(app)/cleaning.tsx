import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { cleaningApi } from '../../src/api/cleaning';
import { getErrorMessage } from '../../src/api/client';
import { EmptyState } from '../../src/components/EmptyState';
import { COLORS } from '../../src/theme/colors';
import { webCentered } from '../../src/theme/responsive';
import type { CleaningTask } from '../../src/types';

export default function CleaningScreen() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [frequencyDays, setFrequencyDays] = useState('');

  const tasksQuery = useQuery({ queryKey: ['cleaning-tasks'], queryFn: cleaningApi.list });

  const createMutation = useMutation({
    mutationFn: () =>
      cleaningApi.create({
        name: name.trim(),
        frequencyDays: frequencyDays.trim() ? Math.max(1, Number(frequencyDays)) : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-tasks'] });
      setName('');
      setFrequencyDays('');
    },
    onError: (e) => Alert.alert('Errore', getErrorMessage(e)),
  });

  const markCleanedMutation = useMutation({
    mutationFn: (id: string) => cleaningApi.markCleaned(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cleaning-tasks'] }),
    onError: (e) => Alert.alert('Errore', getErrorMessage(e)),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => cleaningApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cleaning-tasks'] }),
    onError: (e) => Alert.alert('Errore', getErrorMessage(e)),
  });

  function handleAdd() {
    if (!name.trim()) return;
    createMutation.mutate();
  }

  function confirmDelete(task: CleaningTask) {
    Alert.alert('Elimina', `Rimuovere "${task.name}" dalla lista pulizia?`, [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => removeMutation.mutate(task.id) },
    ]);
  }

  const tasks = tasksQuery.data ?? [];

  return (
    <View style={styles.container}>
      <View style={[styles.addRow, webCentered]}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Es. Bagno, Forno, Frigorifero..."
          placeholderTextColor={COLORS.inkSoft}
          style={styles.addInputName}
          onSubmitEditing={handleAdd}
        />
        <TextInput
          value={frequencyDays}
          onChangeText={setFrequencyDays}
          placeholder="Ogni gg"
          placeholderTextColor={COLORS.inkSoft}
          keyboardType="numeric"
          style={styles.addInputFreq}
        />
        <Pressable onPress={handleAdd} style={styles.addButton} hitSlop={8}>
          <Ionicons name="add" size={18} color={COLORS.white} />
        </Pressable>
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(t) => t.id}
        contentContainerStyle={[styles.list, webCentered]}
        ListEmptyComponent={
          <EmptyState
            icon="sparkles-outline"
            title="Nessun ambiente monitorato"
            subtitle="Aggiungi un ambiente o elettrodomestico per tenere traccia di quando è stato pulito."
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, item.overdue && styles.cardOverdue]}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardStatus}>
                {item.daysSinceCleaned === null
                  ? 'Mai pulito'
                  : item.daysSinceCleaned === 0
                    ? 'Pulito oggi'
                    : `Pulito ${item.daysSinceCleaned} giorn${item.daysSinceCleaned === 1 ? 'o' : 'i'} fa`}
                {item.frequencyDays ? ` · ogni ${item.frequencyDays} gg` : ''}
              </Text>
              {item.overdue ? <Text style={styles.overdueLabel}>Da pulire</Text> : null}
            </View>
            <View style={styles.cardActions}>
              <Pressable onPress={() => markCleanedMutation.mutate(item.id)} style={styles.cleanButton} hitSlop={8}>
                <Ionicons name="checkmark" size={16} color={COLORS.white} />
              </Pressable>
              <Pressable onPress={() => confirmDelete(item)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={COLORS.inkSoft} />
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingTop: 16 },
  addRow: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 20 },
  addInputName: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.ink,
  },
  addInputFreq: {
    width: 72,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.ink,
  },
  addButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: 20, paddingTop: 16, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
  },
  cardOverdue: { borderColor: COLORS.warn },
  cardInfo: { flex: 1, gap: 2 },
  cardName: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
  cardStatus: { fontSize: 12, color: COLORS.inkSoft },
  overdueLabel: { fontSize: 11, fontWeight: '700', color: COLORS.warn, marginTop: 2 },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  cleanButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

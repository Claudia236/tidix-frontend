import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { getErrorMessage } from '../../src/api/client';
import { storageLocationsApi } from '../../src/api/storageLocations';
import { showAlert } from '../../src/components/AppAlert';
import { EmptyState } from '../../src/components/EmptyState';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useStorageLocations } from '../../src/hooks/useStorageLocations';
import { COLORS } from '../../src/theme/colors';
import { webCentered } from '../../src/theme/responsive';
import type { StorageLocation } from '../../src/types';

export default function LocationsScreen() {
  const queryClient = useQueryClient();
  const { locations } = useStorageLocations();

  const [addingOpen, setAddingOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['storage-locations'] });
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const input = { name: name.trim(), emoji: emoji.trim() || undefined };
      return editingId ? storageLocationsApi.update(editingId, input) : storageLocationsApi.create(input);
    },
    onSuccess: () => {
      invalidate();
      closeForm();
    },
    onError: (e) => showAlert('Errore', getErrorMessage(e)),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => storageLocationsApi.remove(id),
    onSuccess: invalidate,
    onError: (e) => showAlert('Errore', getErrorMessage(e)),
  });

  function openAddForm() {
    setEditingId(null);
    setName('');
    setEmoji('');
    setAddingOpen(true);
  }

  function openEditForm(location: StorageLocation) {
    setEditingId(location.id);
    setName(location.name);
    setEmoji(location.emoji);
    setAddingOpen(true);
  }

  function closeForm() {
    setAddingOpen(false);
    setEditingId(null);
  }

  function confirmDelete(location: StorageLocation) {
    showAlert('Elimina posizione', `Rimuovere "${location.name}"? È possibile solo se non ci sono più prodotti lì.`, [
      { text: 'Annulla', style: 'cancel' },
      { text: 'Elimina', style: 'destructive', onPress: () => removeMutation.mutate(location.id) },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={[styles.topSection, webCentered]}>
        <Pressable onPress={() => (addingOpen ? closeForm() : openAddForm())} style={styles.addToggle}>
          <Ionicons name={addingOpen ? 'remove-circle-outline' : 'add-circle-outline'} size={18} color={COLORS.brand} />
          <Text style={styles.addToggleText}>{addingOpen ? 'Annulla' : 'Aggiungi posizione'}</Text>
        </Pressable>

        {addingOpen ? (
          <View style={styles.form}>
            <View style={styles.formRow}>
              <TextInput
                value={emoji}
                onChangeText={(v) => setEmoji(Array.from(v).slice(0, 1).join(''))}
                placeholder="📦"
                placeholderTextColor={COLORS.inkSoft}
                style={styles.emojiInput}
              />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Es. Cantina"
                placeholderTextColor={COLORS.inkSoft}
                style={styles.nameInput}
                autoFocus
              />
            </View>
            <Text style={styles.hint}>L'emoji è opzionale: puoi incollarne una o lasciare vuoto (📦 di default).</Text>
            <PrimaryButton
              label={editingId ? 'Salva modifiche' : 'Aggiungi'}
              onPress={() => saveMutation.mutate()}
              disabled={!name.trim()}
              loading={saveMutation.isPending}
            />
          </View>
        ) : null}
      </View>

      <FlatList
        data={locations}
        keyExtractor={(l) => l.id}
        contentContainerStyle={[styles.list, webCentered]}
        ListEmptyComponent={<EmptyState icon="cube-outline" title="Nessuna posizione" />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowEmoji}>{item.emoji}</Text>
            <Text style={styles.rowName}>{item.name}</Text>
            <Pressable onPress={() => openEditForm(item)} hitSlop={8}>
              <Ionicons name="pencil-outline" size={18} color={COLORS.inkSoft} />
            </Pressable>
            <Pressable onPress={() => confirmDelete(item)} hitSlop={8} style={{ marginLeft: 14 }}>
              <Ionicons name="trash-outline" size={18} color={COLORS.inkSoft} />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, paddingTop: 16 },
  topSection: { paddingHorizontal: 20, gap: 12 },
  addToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  addToggleText: { fontSize: 14, fontWeight: '700', color: COLORS.brand },
  form: {
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 16,
  },
  formRow: { flexDirection: 'row', gap: 8 },
  emojiInput: {
    width: 56,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 18,
    textAlign: 'center',
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.ink,
  },
  hint: { fontSize: 11, color: COLORS.inkSoft },
  list: { padding: 20, paddingTop: 16, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
  },
  rowEmoji: { fontSize: 20 },
  rowName: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.ink },
});

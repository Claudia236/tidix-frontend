import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { getErrorMessage } from '../../src/api/client';
import { storageLocationsApi } from '../../src/api/storageLocations';
import { showAlert } from '../../src/components/AppAlert';
import { EmptyState } from '../../src/components/EmptyState';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useStorageLocations } from '../../src/hooks/useStorageLocations';
import { useI18n } from '../../src/i18n/I18nContext';
import type { ColorPalette } from '../../src/theme/colors';
import { useTheme } from '../../src/theme/ThemeContext';
import { webCentered } from '../../src/theme/responsive';
import type { StorageLocation } from '../../src/types';

export default function LocationsScreen() {
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => storageLocationsApi.remove(id),
    onSuccess: invalidate,
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
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
    showAlert(t('locations.confirmDeleteTitle'), t('locations.confirmDeleteMessage', { name: location.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeMutation.mutate(location.id) },
    ]);
  }

  return (
    <View style={styles.container}>
      <View style={[styles.topSection, webCentered]}>
        <Pressable onPress={() => (addingOpen ? closeForm() : openAddForm())} style={styles.addToggle}>
          <Ionicons name={addingOpen ? 'remove-circle-outline' : 'add-circle-outline'} size={18} color={colors.brand} />
          <Text style={styles.addToggleText}>{addingOpen ? t('common.cancel') : t('locations.addToggle')}</Text>
        </Pressable>

        {addingOpen ? (
          <View style={styles.form}>
            <View style={styles.formRow}>
              <TextInput
                value={emoji}
                onChangeText={(v) => setEmoji(Array.from(v).slice(0, 1).join(''))}
                placeholder="📦"
                placeholderTextColor={colors.inkSoft}
                style={styles.emojiInput}
              />
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder={t('itemForm.newLocation.namePlaceholder')}
                placeholderTextColor={colors.inkSoft}
                style={styles.nameInput}
                autoFocus
              />
            </View>
            <Text style={styles.hint}>{t('locations.emojiHint')}</Text>
            <PrimaryButton
              label={editingId ? t('common.saveChanges') : t('common.add')}
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
        ListEmptyComponent={<EmptyState icon="cube-outline" title={t('locations.emptyTitle')} />}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowEmoji}>{item.emoji}</Text>
            <Text style={styles.rowName}>{item.name}</Text>
            <Pressable onPress={() => openEditForm(item)} hitSlop={8}>
              <Ionicons name="pencil-outline" size={18} color={colors.inkSoft} />
            </Pressable>
            <Pressable onPress={() => confirmDelete(item)} hitSlop={8} style={{ marginLeft: 14 }}>
              <Ionicons name="trash-outline" size={18} color={colors.inkSoft} />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg, paddingTop: 16 },
    topSection: { paddingHorizontal: 20, gap: 12 },
    addToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    addToggleText: { fontSize: 14, fontWeight: '700', color: COLORS.brand },
    form: {
      gap: 10,
      backgroundColor: COLORS.card,
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
      backgroundColor: COLORS.card,
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
      backgroundColor: COLORS.card,
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
      backgroundColor: COLORS.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.line,
      padding: 14,
    },
    rowEmoji: { fontSize: 20 },
    rowName: { flex: 1, fontSize: 14, fontWeight: '700', color: COLORS.ink },
  });
}

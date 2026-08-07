import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supermarketsApi } from '../api/supermarkets';
import { locationColor } from '../constants/domain';
import { useSupermarkets } from '../hooks/useSupermarkets';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import type { Supermarket } from '../types';
import { showAlert } from './AppAlert';

interface Props {
  value: string | null;
  onChange: (id: string | null) => void;
  label: string;
}

export function SupermarketPicker({ value, onChange, label }: Props) {
  const { colors, scheme } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const { supermarkets, byId } = useSupermarkets();

  const [adding, setAdding] = useState(false);
  const [newEmoji, setNewEmoji] = useState('');
  const [newName, setNewName] = useState('');

  const createMutation = useMutation({
    mutationFn: () => supermarketsApi.create({ name: newName.trim(), emoji: newEmoji.trim() || undefined }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['supermarkets'] });
      onChange(created.id);
      setNewName('');
      setNewEmoji('');
      setAdding(false);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => supermarketsApi.remove(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['supermarkets'] });
      if (value === id) onChange(null);
    },
  });

  function handleCreate() {
    if (!newName.trim()) return;
    createMutation.mutate();
  }

  function handleSelect(id: string) {
    onChange(value === id ? null : id);
  }

  function handleDelete(supermarket: Supermarket) {
    showAlert(t('supermarket.confirmDeleteTitle'), t('supermarket.confirmDeleteMessage', { name: supermarket.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeMutation.mutate(supermarket.id) },
    ]);
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.grid}>
        {supermarkets.map((supermarket) => {
          const active = value === supermarket.id;
          const { color } = locationColor(supermarket.id, scheme, supermarket.colorIndex);
          return (
            <View
              key={supermarket.id}
              style={[styles.chip, { borderColor: active ? color : colors.line, backgroundColor: active ? color : colors.card }]}
            >
              <Pressable onPress={() => handleSelect(supermarket.id)} style={styles.chipPressable}>
                <Text style={{ fontSize: 14 }}>{supermarket.emoji}</Text>
                <Text style={[styles.chipText, { color: active ? colors.white : colors.ink }]}>{supermarket.name}</Text>
              </Pressable>
              <Pressable onPress={() => handleDelete(supermarket)} hitSlop={8}>
                <Ionicons name="close" size={14} color={active ? colors.white : colors.inkSoft} />
              </Pressable>
            </View>
          );
        })}
        <Pressable onPress={() => setAdding(true)} style={[styles.chip, styles.addChip]}>
          <Ionicons name="add" size={16} color={colors.brand} />
          <Text style={[styles.chipText, { color: colors.brand }]}>{t('supermarket.new')}</Text>
        </Pressable>
      </View>

      {adding ? (
        <View style={styles.newRow}>
          <TextInput
            value={newEmoji}
            onChangeText={(v) => setNewEmoji(Array.from(v).slice(0, 1).join(''))}
            placeholder="🛒"
            placeholderTextColor={colors.inkSoft}
            style={styles.newEmojiInput}
          />
          <TextInput
            value={newName}
            onChangeText={setNewName}
            placeholder={t('supermarket.new.namePlaceholder')}
            placeholderTextColor={colors.inkSoft}
            style={styles.newNameInput}
            autoFocus
            onSubmitEditing={handleCreate}
          />
          <Pressable onPress={handleCreate} style={styles.newConfirmButton} hitSlop={8}>
            <Ionicons name="checkmark" size={16} color={colors.white} />
          </Pressable>
          <Pressable onPress={() => setAdding(false)} style={styles.newCancelButton} hitSlop={8}>
            <Ionicons name="close" size={16} color={colors.inkSoft} />
          </Pressable>
        </View>
      ) : null}

      {!adding && value && byId.get(value) ? (
        <Pressable onPress={() => onChange(null)} hitSlop={8} style={styles.clearRow}>
          <Ionicons name="close-circle-outline" size={14} color={colors.inkSoft} />
          <Text style={styles.clearText}>{t('supermarket.clear')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    field: { gap: 8 },
    label: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: COLORS.inkSoft,
    },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    chipPressable: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    addChip: { borderColor: COLORS.brand, borderStyle: 'dashed', backgroundColor: COLORS.card },
    chipText: { fontWeight: '600', fontSize: 13 },
    newRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
    newEmojiInput: {
      width: 44,
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 8,
      fontSize: 16,
      textAlign: 'center',
      backgroundColor: COLORS.card,
    },
    newNameInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 8,
      fontSize: 13,
      color: COLORS.ink,
      backgroundColor: COLORS.card,
    },
    newConfirmButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: COLORS.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
    newCancelButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clearRow: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
    clearText: { fontSize: 12, color: COLORS.inkSoft },
  });
}

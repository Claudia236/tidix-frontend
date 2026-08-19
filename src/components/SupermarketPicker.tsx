import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { supermarketsApi } from '../api/supermarkets';
import { locationColor } from '../constants/domain';
import { useModalBackHandler } from '../hooks/useModalBackHandler';
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

  const [modalVisible, setModalVisible] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newEmoji, setNewEmoji] = useState('');
  const [newName, setNewName] = useState('');

  const selected = value ? byId.get(value) : null;

  const createMutation = useMutation({
    mutationFn: () => supermarketsApi.create({ name: newName.trim(), emoji: newEmoji.trim() || undefined }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['supermarkets'] });
      onChange(created.id);
      setNewName('');
      setNewEmoji('');
      setAdding(false);
      setModalVisible(false);
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
    onChange(id);
    setModalVisible(false);
  }

  function handleDelete(supermarket: Supermarket) {
    showAlert(t('supermarket.confirmDeleteTitle'), t('supermarket.confirmDeleteMessage', { name: supermarket.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeMutation.mutate(supermarket.id) },
    ]);
  }

  function closeModal() {
    setModalVisible(false);
    setAdding(false);
  }

  useModalBackHandler(modalVisible, closeModal);

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.trigger} onPress={() => setModalVisible(true)}>
        <Text style={{ fontSize: 16 }}>{selected?.emoji ?? '🛒'}</Text>
        <Text style={styles.triggerText}>{selected?.name ?? t('common.none')}</Text>
        <Ionicons name="chevron-down" size={16} color={colors.inkSoft} />
      </Pressable>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeModal}>
        <Pressable style={styles.backdrop} onPress={closeModal}>
          <Pressable style={styles.card} onPress={() => {}}>
            <Text style={styles.cardTitle}>{label}</Text>
            <ScrollView keyboardShouldPersistTaps="handled">
              <View style={styles.grid}>
                <Pressable
                  onPress={() => {
                    onChange(null);
                    setModalVisible(false);
                  }}
                  style={[styles.chip, !value && styles.chipActive]}
                >
                  <Text style={[styles.chipText, { color: !value ? colors.white : colors.ink }]}>{t('common.none')}</Text>
                </Pressable>
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
            </ScrollView>

            <Pressable onPress={closeModal} hitSlop={8}>
              <Text style={styles.cardClose}>{t('common.close')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
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
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    triggerText: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.ink },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, gap: 4, width: '100%', maxWidth: 360, maxHeight: '80%' },
    cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 8 },
    cardClose: { textAlign: 'center', fontSize: 13, fontWeight: '600', color: COLORS.inkSoft, marginTop: 12 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },
    chipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
    chipPressable: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    addChip: { borderColor: COLORS.brand, borderStyle: 'dashed', backgroundColor: COLORS.card },
    chipText: { fontWeight: '600', fontSize: 13 },
    newRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 12 },
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
  });
}

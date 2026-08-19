import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelectableCategories } from '../constants/domain';
import { useModalBackHandler } from '../hooks/useModalBackHandler';
import { useVoiceDictation } from '../hooks/useVoiceDictation';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { webCentered } from '../theme/responsive';
import type { Category } from '../types';
import { PrimaryButton } from './PrimaryButton';
import { SupermarketPicker } from './SupermarketPicker';
import { TextField } from './TextField';

type VoiceTarget = 'name' | 'detail';

export interface ShoppingNoteFormInput {
  text: string;
  detail: string;
  category: Category | null;
  supermarketId: string | null;
}

interface Props {
  initial?: { text?: string; detail?: string | null; category?: Category | null; supermarketId?: string | null };
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (input: ShoppingNoteFormInput) => void;
  onDelete?: () => void;
  deleting?: boolean;
}

export function ShoppingNoteForm({ initial, submitLabel, submitting, onSubmit, onDelete, deleting }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const categories = useSelectableCategories();

  const [name, setName] = useState(initial?.text ?? '');
  const [detail, setDetail] = useState(initial?.detail ?? '');
  const [category, setCategory] = useState<Category | null>(initial?.category ?? null);
  const [supermarketId, setSupermarketId] = useState<string | null>(initial?.supermarketId ?? null);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);

  const selectedCategoryInfo = category ? categories.find((c) => c.key === category) ?? null : null;

  const voice = useVoiceDictation<VoiceTarget>((target, transcript) => {
    const capitalized = transcript.charAt(0).toUpperCase() + transcript.slice(1);
    if (target === 'name') setName(capitalized);
    else setDetail(capitalized);
  });

  useModalBackHandler(categoryModalVisible, () => setCategoryModalVisible(false));

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 48 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
      <TextField
        label={t('shoppingNote.new.nameLabel')}
        placeholder={t('shoppingNote.new.namePlaceholder')}
        value={name}
        onChangeText={setName}
        autoFocus
        labelExtra={
          voice.available ? (
            <Pressable onPress={() => voice.start('name')} hitSlop={8}>
              <Ionicons
                name={voice.target === 'name' ? 'mic' : 'mic-outline'}
                size={16}
                color={voice.target === 'name' ? colors.danger : colors.brand}
              />
            </Pressable>
          ) : null
        }
      />
      <TextField
        label={t('shoppingNote.new.detailLabel')}
        placeholder={t('shoppingNote.new.detailPlaceholder')}
        value={detail}
        onChangeText={setDetail}
        labelExtra={
          voice.available ? (
            <Pressable onPress={() => voice.start('detail')} hitSlop={8}>
              <Ionicons
                name={voice.target === 'detail' ? 'mic' : 'mic-outline'}
                size={16}
                color={voice.target === 'detail' ? colors.danger : colors.brand}
              />
            </Pressable>
          ) : null
        }
      />

      <View style={styles.field}>
        <Text style={styles.label}>{t('shoppingNote.new.categoryLabel')}</Text>
        <Pressable style={styles.trigger} onPress={() => setCategoryModalVisible(true)}>
          <Text style={{ fontSize: 16 }}>{selectedCategoryInfo?.emoji ?? '🏷️'}</Text>
          <Text style={styles.triggerText}>{selectedCategoryInfo?.short ?? t('common.none')}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.inkSoft} />
        </Pressable>

        <Modal
          visible={categoryModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCategoryModalVisible(false)}
        >
          <Pressable style={styles.pickerBackdrop} onPress={() => setCategoryModalVisible(false)}>
            <Pressable style={styles.pickerCard} onPress={() => {}}>
              <Text style={styles.pickerCardTitle}>{t('shoppingNote.new.categoryLabel')}</Text>
              <ScrollView>
                <View style={styles.categoryGrid}>
                  <Pressable
                    onPress={() => {
                      setCategory(null);
                      setCategoryModalVisible(false);
                    }}
                    style={[styles.categoryChip, !category && styles.categoryChipActive]}
                  >
                    <Text style={[styles.categoryChipText, !category && styles.categoryChipTextActive]}>
                      {t('common.none')}
                    </Text>
                  </Pressable>
                  {categories.map((cat) => {
                    const active = category === cat.key;
                    return (
                      <Pressable
                        key={cat.key}
                        onPress={() => {
                          setCategory(cat.key);
                          setCategoryModalVisible(false);
                        }}
                        style={[styles.categoryChip, active && styles.categoryChipActive]}
                      >
                        <Text style={{ fontSize: 16 }}>{cat.emoji}</Text>
                        <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{cat.short}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
              <Pressable onPress={() => setCategoryModalVisible(false)} hitSlop={8}>
                <Text style={styles.pickerCardClose}>{t('common.close')}</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      </View>

      <SupermarketPicker value={supermarketId} onChange={setSupermarketId} label={t('itemForm.supermarket.label')} />

      <View style={styles.actions}>
        {onDelete ? (
          <PrimaryButton label={t('common.delete')} variant="danger" onPress={onDelete} loading={deleting} style={{ flex: 0 }} />
        ) : null}
        <PrimaryButton
          label={submitLabel}
          onPress={() => onSubmit({ text: name.trim(), detail: detail.trim(), category, supermarketId })}
          disabled={!name.trim()}
          loading={submitting}
          style={{ flex: 1 }}
        />
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    content: { padding: 20, gap: 16, paddingBottom: 48, ...webCentered },
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
    pickerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    pickerCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, gap: 4, width: '100%', maxWidth: 360, maxHeight: '80%' },
    pickerCardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 8 },
    pickerCardClose: { textAlign: 'center', fontSize: 13, fontWeight: '600', color: COLORS.inkSoft, marginTop: 12 },
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    categoryChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
    categoryChipText: { fontSize: 12, fontWeight: '600', color: COLORS.ink },
    categoryChipTextActive: { color: COLORS.white },
    actions: { flexDirection: 'row', gap: 10 },
  });
}

import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSelectableCategories } from '../constants/domain';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { webCentered } from '../theme/responsive';
import type { Category } from '../types';
import { PrimaryButton } from './PrimaryButton';
import { TextField } from './TextField';

export interface ShoppingNoteFormInput {
  text: string;
  detail: string;
  category: Category | null;
}

interface Props {
  initial?: { text?: string; detail?: string | null; category?: Category | null };
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (input: ShoppingNoteFormInput) => void;
  onDelete?: () => void;
  deleting?: boolean;
}

export function ShoppingNoteForm({ initial, submitLabel, submitting, onSubmit, onDelete, deleting }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const categories = useSelectableCategories();

  const [name, setName] = useState(initial?.text ?? '');
  const [detail, setDetail] = useState(initial?.detail ?? '');
  const [category, setCategory] = useState<Category | null>(initial?.category ?? null);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <TextField
        label={t('shoppingNote.new.nameLabel')}
        placeholder={t('shoppingNote.new.namePlaceholder')}
        value={name}
        onChangeText={setName}
        autoFocus
      />
      <TextField
        label={t('shoppingNote.new.detailLabel')}
        placeholder={t('shoppingNote.new.detailPlaceholder')}
        value={detail}
        onChangeText={setDetail}
      />

      <View style={styles.field}>
        <Text style={styles.label}>{t('shoppingNote.new.categoryLabel')}</Text>
        <View style={styles.categoryGrid}>
          {categories.map((cat) => {
            const active = category === cat.key;
            return (
              <Pressable
                key={cat.key}
                onPress={() => setCategory(active ? null : cat.key)}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
              >
                <Text style={{ fontSize: 16 }}>{cat.emoji}</Text>
                <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>{cat.short}</Text>
                {active ? <Ionicons name="close" size={12} color={colors.white} /> : null}
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.actions}>
        {onDelete ? (
          <PrimaryButton label={t('common.delete')} variant="danger" onPress={onDelete} loading={deleting} style={{ flex: 0 }} />
        ) : null}
        <PrimaryButton
          label={submitLabel}
          onPress={() => onSubmit({ text: name.trim(), detail: detail.trim(), category })}
          disabled={!name.trim()}
          loading={submitting}
          style={{ flex: 1 }}
        />
      </View>
    </ScrollView>
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

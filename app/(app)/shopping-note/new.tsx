import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getErrorMessage } from '../../../src/api/client';
import { shoppingNotesApi } from '../../../src/api/shoppingNotes';
import { showAlert } from '../../../src/components/AppAlert';
import { PrimaryButton } from '../../../src/components/PrimaryButton';
import { TextField } from '../../../src/components/TextField';
import { useSelectableCategories } from '../../../src/constants/domain';
import { useI18n } from '../../../src/i18n/I18nContext';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';
import { webCentered } from '../../../src/theme/responsive';
import type { Category } from '../../../src/types';

export default function NewShoppingNoteScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const categories = useSelectableCategories();

  const [name, setName] = useState('');
  const [detail, setDetail] = useState('');
  const [category, setCategory] = useState<Category | null>(null);

  const createMutation = useMutation({
    mutationFn: () => shoppingNotesApi.create({ text: name.trim(), detail: detail.trim(), category }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-notes'] });
      router.back();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

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

      <PrimaryButton
        label={t('shoppingNote.new.saveButton')}
        onPress={() => createMutation.mutate()}
        disabled={!name.trim()}
        loading={createMutation.isPending}
      />
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
  });
}

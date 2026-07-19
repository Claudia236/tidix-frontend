import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCleaningSuggestions, type CleaningSuggestion } from '../constants/domain';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { webCentered } from '../theme/responsive';
import type { CleaningTaskInput } from '../types';
import { DatePickerField } from './DatePickerField';
import { PrimaryButton } from './PrimaryButton';
import { TextField } from './TextField';

interface Props {
  initial?: Partial<CleaningTaskInput>;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (input: CleaningTaskInput) => void;
  onDelete?: () => void;
  deleting?: boolean;
}

export function CleaningTaskForm({ initial, submitLabel, submitting, onSubmit, onDelete, deleting }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const cleaningSuggestions = useCleaningSuggestions();

  const [name, setName] = useState(initial?.name ?? '');
  const [frequencyDays, setFrequencyDays] = useState(initial?.frequencyDays ? String(initial.frequencyDays) : '');
  const [lastCleanedDate, setLastCleanedDate] = useState<string | null>(initial?.lastCleanedDate ?? null);

  function applySuggestion(suggestion: CleaningSuggestion) {
    setName(suggestion.name);
    setFrequencyDays(String(suggestion.frequencyDays));
  }

  function handleSubmit() {
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      frequencyDays: frequencyDays.trim() ? Math.max(1, Number(frequencyDays)) : null,
      lastCleanedDate,
    });
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        contentContainerStyle={[styles.container, webCentered, { paddingBottom: 40 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          label={t('cleaning.nameLabel')}
          placeholder={t('cleaning.namePlaceholder')}
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <View style={styles.field}>
          <Text style={styles.label}>{t('cleaning.suggestionsLabel')}</Text>
          <View style={styles.suggestionRow}>
            {cleaningSuggestions.map((s) => (
              <Pressable key={s.name} onPress={() => applySuggestion(s)} style={styles.suggestionChip}>
                <Text style={{ fontSize: 13 }}>{s.emoji}</Text>
                <Text style={styles.suggestionChipText}>{s.name}</Text>
                <Text style={styles.suggestionChipFreq}>{t('cleaning.everyDaysShort', { n: s.frequencyDays })}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <TextField
          label={t('cleaning.frequencyLabel')}
          placeholder={t('cleaning.frequencyPlaceholder')}
          keyboardType="numeric"
          value={frequencyDays}
          onChangeText={setFrequencyDays}
        />

        <View style={styles.field}>
          <Text style={styles.label}>{t('cleaning.lastCleanedLabel')}</Text>
          <DatePickerField
            value={lastCleanedDate}
            onChange={setLastCleanedDate}
            placeholder={t('cleaning.lastCleanedPlaceholder')}
            clearLabel={t('cleaning.lastCleanedClear')}
          />
        </View>

        <View style={styles.actions}>
          {onDelete ? (
            <PrimaryButton label={t('common.delete')} variant="danger" onPress={onDelete} loading={deleting} style={{ flex: 0 }} />
          ) : null}
          <PrimaryButton label={submitLabel} onPress={handleSubmit} disabled={!name.trim()} loading={submitting} style={{ flex: 1 }} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    container: { padding: 20, gap: 16 },
    field: { gap: 8 },
    label: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: COLORS.inkSoft,
    },
    suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    suggestionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    suggestionChipText: { fontSize: 12, fontWeight: '600', color: COLORS.ink },
    suggestionChipFreq: { fontSize: 10, color: COLORS.inkSoft },
    actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  });
}

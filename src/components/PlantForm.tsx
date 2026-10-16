import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { webCentered } from '../theme/responsive';
import type { PlantInput } from '../types';
import { DatePickerField } from './DatePickerField';
import { PrimaryButton } from './PrimaryButton';
import { TextField } from './TextField';

type FrequencyUnit = 'giorni' | 'settimane';
const DAYS_PER_WEEK = 7;

interface Props {
  initial?: Partial<PlantInput>;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (input: PlantInput) => void;
  onDelete?: () => void;
  deleting?: boolean;
}

// Un valore di giorni si mostra in settimane solo se e' un multiplo esatto
// di 7: altrimenti mostrarlo diviso per 7 arrotonderebbe in modo fuorviante.
function frequencyDaysToDisplay(days: number): { amount: string; unit: FrequencyUnit } {
  if (days > 0 && days % DAYS_PER_WEEK === 0) {
    return { amount: String(days / DAYS_PER_WEEK), unit: 'settimane' };
  }
  return { amount: String(days), unit: 'giorni' };
}

export function PlantForm({ initial, submitLabel, submitting, onSubmit, onDelete, deleting }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState(initial?.name ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const initialFrequency = initial?.wateringFrequencyDays ? frequencyDaysToDisplay(initial.wateringFrequencyDays) : null;
  const [frequencyAmount, setFrequencyAmount] = useState(initialFrequency?.amount ?? '');
  const [frequencyUnit, setFrequencyUnit] = useState<FrequencyUnit>(initialFrequency?.unit ?? 'giorni');
  const [lastWateredDate, setLastWateredDate] = useState<string | null>(initial?.lastWateredDate ?? null);

  const parsedFrequency = frequencyAmount.trim() ? Number(frequencyAmount.trim().replace(',', '.')) : null;
  const frequencyValid = parsedFrequency === null || (Number.isFinite(parsedFrequency) && parsedFrequency > 0);

  function handleSubmit() {
    if (!name.trim() || !frequencyValid) return;
    const amount = parsedFrequency !== null ? Math.max(1, Math.round(parsedFrequency)) : null;
    onSubmit({
      name: name.trim(),
      location: location.trim() || null,
      wateringFrequencyDays: amount ? amount * (frequencyUnit === 'settimane' ? DAYS_PER_WEEK : 1) : null,
      lastWateredDate,
    });
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.container, webCentered, { paddingBottom: 40 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          label={t('plants.nameLabel')}
          placeholder={t('plants.namePlaceholder')}
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <TextField
          label={t('plants.locationLabel')}
          placeholder={t('plants.locationPlaceholder')}
          value={location}
          onChangeText={setLocation}
        />

        <View style={styles.frequencyRow}>
          <View style={{ flex: 1 }}>
            <TextField
              label={t('plants.frequencyLabel')}
              placeholder={t('plants.frequencyPlaceholder')}
              keyboardType="numeric"
              value={frequencyAmount}
              onChangeText={setFrequencyAmount}
            />
          </View>
          <View style={styles.frequencyUnitGroup}>
            <Pressable
              onPress={() => setFrequencyUnit('giorni')}
              style={[styles.frequencyUnitChip, frequencyUnit === 'giorni' && styles.frequencyUnitChipActive]}
            >
              <Text style={[styles.frequencyUnitChipText, frequencyUnit === 'giorni' && { color: colors.white }]}>
                {t('itemForm.consumeWithin.unitDays')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFrequencyUnit('settimane')}
              style={[styles.frequencyUnitChip, frequencyUnit === 'settimane' && styles.frequencyUnitChipActive]}
            >
              <Text style={[styles.frequencyUnitChipText, frequencyUnit === 'settimane' && { color: colors.white }]}>
                {t('plants.unitWeeks')}
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('plants.lastWateredLabel')}</Text>
          <DatePickerField
            value={lastWateredDate}
            onChange={setLastWateredDate}
            placeholder={t('plants.lastWateredPlaceholder')}
            clearLabel={t('plants.lastWateredClear')}
          />
        </View>

        <View style={styles.actions}>
          {onDelete ? (
            <PrimaryButton label={t('common.delete')} variant="danger" onPress={onDelete} loading={deleting} style={{ flex: 0 }} />
          ) : null}
          <PrimaryButton label={submitLabel} onPress={handleSubmit} disabled={!name.trim() || !frequencyValid} loading={submitting} style={{ flex: 1 }} />
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
    frequencyRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
    frequencyUnitGroup: { flexDirection: 'row', gap: 6 },
    frequencyUnitChip: {
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: COLORS.card,
    },
    frequencyUnitChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
    frequencyUnitChipText: { fontSize: 12, fontWeight: '600', color: COLORS.ink },
    actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  });
}

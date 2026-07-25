import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LOCATION_PALETTE } from '../constants/domain';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { webCentered } from '../theme/responsive';
import { PrimaryButton } from './PrimaryButton';

export interface ZoneFormInput {
  name: string;
  emoji?: string;
  colorIndex: number | null;
}

interface Props {
  initial?: { name?: string; emoji?: string; colorIndex?: number | null };
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (input: ZoneFormInput) => void;
  onDelete?: () => void;
  deleting?: boolean;
}

export function ZoneForm({ initial, submitLabel, submitting, onSubmit, onDelete, deleting }: Props) {
  const { colors, scheme } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '');
  const [colorIndex, setColorIndex] = useState<number | null>(initial?.colorIndex ?? null);

  return (
    <KeyboardAvoidingView style={styles.container} behavior="padding">
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 48 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.row}>
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
            placeholder={t('zone.namePlaceholder')}
            placeholderTextColor={colors.inkSoft}
            style={styles.nameInput}
            autoFocus
          />
        </View>
        <Text style={styles.hint}>{t('zone.emojiHint')}</Text>

        <Text style={styles.label}>{t('zone.colorLabel')}</Text>
        <View style={styles.colorRow}>
          <Pressable
            onPress={() => setColorIndex(null)}
            style={[styles.swatch, styles.swatchAuto, colorIndex === null && styles.swatchActive]}
          >
            {colorIndex === null ? <Ionicons name="checkmark" size={16} color={colors.ink} /> : null}
          </Pressable>
          {LOCATION_PALETTE[scheme].map((swatch, index) => (
            <Pressable
              key={index}
              onPress={() => setColorIndex(index)}
              style={[styles.swatch, { backgroundColor: swatch.color }, colorIndex === index && styles.swatchActive]}
            >
              {colorIndex === index ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
            </Pressable>
          ))}
        </View>

        <View style={styles.actions}>
          {onDelete ? (
            <PrimaryButton label={t('common.delete')} variant="danger" onPress={onDelete} loading={deleting} style={{ flex: 0 }} />
          ) : null}
          <PrimaryButton
            label={submitLabel}
            onPress={() => onSubmit({ name: name.trim(), emoji: emoji.trim() || undefined, colorIndex })}
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
    content: { padding: 20, gap: 12, paddingBottom: 48, ...webCentered },
    row: { flexDirection: 'row', gap: 8 },
    emojiInput: {
      width: 56,
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 10,
      fontSize: 18,
      textAlign: 'center',
      backgroundColor: COLORS.card,
    },
    nameInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: COLORS.ink,
      backgroundColor: COLORS.card,
    },
    hint: { fontSize: 11, color: COLORS.inkSoft, marginTop: -4 },
    label: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: COLORS.inkSoft,
      marginTop: 8,
    },
    colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    swatch: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: COLORS.line,
    },
    swatchAuto: { backgroundColor: COLORS.card, borderStyle: 'dashed' as const },
    swatchActive: { borderWidth: 2, borderColor: COLORS.ink },
    actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  });
}

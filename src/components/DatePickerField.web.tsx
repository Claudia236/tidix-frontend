import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  value: string | null;
  onChange: (value: string | null) => void;
  clearLabel?: string;
  allowClear?: boolean;
}

export function DatePickerField({ value, onChange, clearLabel, allowClear = true }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View>
      <View style={styles.dateButton}>
        {React.createElement('input', {
          type: 'date',
          value: value ?? '',
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value || null),
          style: {
            border: 'none',
            outline: 'none',
            background: 'transparent',
            fontFamily: 'inherit',
            fontSize: 14,
            color: colors.ink,
            width: '100%',
          },
        })}
      </View>
      {allowClear && value ? (
        <Pressable onPress={() => onChange(null)}>
          <Text style={styles.clearDate}>{clearLabel ?? t('common.removeDateDefault')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    dateButton: {
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: COLORS.card,
    },
    clearDate: { fontSize: 12, color: COLORS.danger, marginTop: 6, fontWeight: '600' },
  });
}

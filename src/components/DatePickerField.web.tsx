import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme/colors';

interface Props {
  value: string | null;
  onChange: (value: string | null) => void;
  clearLabel?: string;
  allowClear?: boolean;
}

export function DatePickerField({ value, onChange, clearLabel = 'Rimuovi scadenza', allowClear = true }: Props) {
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
            color: COLORS.ink,
            width: '100%',
          },
        })}
      </View>
      {allowClear && value ? (
        <Pressable onPress={() => onChange(null)}>
          <Text style={styles.clearDate}>{clearLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dateButton: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
  },
  clearDate: { fontSize: 12, color: COLORS.danger, marginTop: 6, fontWeight: '600' },
});

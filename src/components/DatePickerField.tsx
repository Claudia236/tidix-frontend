import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme/colors';

interface Props {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  clearLabel?: string;
  allowClear?: boolean;
}

export function DatePickerField({
  value,
  onChange,
  placeholder = 'Nessuna scadenza',
  clearLabel = 'Rimuovi scadenza',
  allowClear = true,
}: Props) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View>
      <Pressable style={styles.dateButton} onPress={() => setShowPicker(true)}>
        <Ionicons name="calendar-outline" size={16} color={COLORS.ink} />
        <Text style={styles.dateButtonText}>{value ?? placeholder}</Text>
      </Pressable>
      {allowClear && value ? (
        <Pressable onPress={() => onChange(null)}>
          <Text style={styles.clearDate}>{clearLabel}</Text>
        </Pressable>
      ) : null}
      {showPicker ? (
        <DateTimePicker
          value={value ? new Date(`${value}T00:00:00`) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(event, date) => {
            setShowPicker(Platform.OS === 'ios');
            if (event.type === 'dismissed') {
              setShowPicker(false);
              return;
            }
            if (date) {
              onChange(date.toISOString().slice(0, 10));
            }
            if (Platform.OS === 'android') setShowPicker(false);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
  },
  dateButtonText: { fontSize: 14, color: COLORS.ink },
  clearDate: { fontSize: 12, color: COLORS.danger, marginTop: 6, fontWeight: '600' },
});

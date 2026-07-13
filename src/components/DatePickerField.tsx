import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { formatFullDate, toLocalISODate } from '../utils/expiry';

interface Props {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  clearLabel?: string;
  allowClear?: boolean;
}

export function DatePickerField({ value, onChange, placeholder, clearLabel, allowClear = true }: Props) {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [showPicker, setShowPicker] = useState(false);

  return (
    <View>
      <Pressable style={styles.dateButton} onPress={() => setShowPicker(true)}>
        <Ionicons name="calendar-outline" size={16} color={colors.ink} />
        <Text style={styles.dateButtonText}>
          {value ? formatFullDate(value, language) : placeholder ?? t('common.noDateDefault')}
        </Text>
      </Pressable>
      {allowClear && value ? (
        <Pressable onPress={() => onChange(null)}>
          <Text style={styles.clearDate}>{clearLabel ?? t('common.removeDateDefault')}</Text>
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
              onChange(toLocalISODate(date));
            }
            if (Platform.OS === 'android') setShowPicker(false);
          }}
        />
      ) : null}
    </View>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: COLORS.card,
    },
    dateButtonText: { fontSize: 14, color: COLORS.ink },
    clearDate: { fontSize: 12, color: COLORS.danger, marginTop: 6, fontWeight: '600' },
  });
}

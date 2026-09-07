import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  clearLabel?: string;
  allowClear?: boolean;
}

export function DatePickerField({ value, onChange, placeholder, clearLabel, allowClear = true }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [focused, setFocused] = useState(false);

  return (
    <View>
      <View style={styles.dateButton}>
        {React.createElement('input', {
          type: 'date',
          value: value ?? '',
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value || null),
          onFocus: () => setFocused(true),
          onBlur: () => setFocused(false),
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
        {/* input[type=date] ignora l'attributo placeholder su Chrome/Edge
            (mostra sempre il proprio formato mm/dd/yyyy): quando non c'e'
            valore si copre l'input con questo testo, cliccabile "attraverso"
            (pointerEvents none) cosi' apre comunque il calendario nativo.
            Nascosto mentre il campo ha il focus, altrimenti coprirebbe le
            cifre che l'utente sta digitando a mano (l'input valorizza
            value solo a data completa, quindi resterebbe "vuoto" per
            tutta la digitazione). */}
        {!value && !focused ? (
          <View style={styles.placeholderOverlay} pointerEvents="none">
            <Text style={styles.placeholderText}>{placeholder ?? t('common.noDateDefault')}</Text>
          </View>
        ) : null}
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
      position: 'relative',
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 12,
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: COLORS.card,
    },
    placeholderOverlay: {
      position: 'absolute',
      left: 1,
      right: 1,
      top: 1,
      bottom: 1,
      borderRadius: 11,
      backgroundColor: COLORS.card,
      justifyContent: 'center',
      paddingHorizontal: 14,
    },
    placeholderText: { fontSize: 14, color: COLORS.inkSoft },
    clearDate: { fontSize: 12, color: COLORS.danger, marginTop: 6, fontWeight: '600' },
  });
}

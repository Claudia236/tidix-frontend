import React, { useMemo } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

interface Props extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, style, ...rest }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.inkSoft}
        style={[styles.input, error ? styles.inputError : null, style]}
        {...rest}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    container: { width: '100%' },
    label: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: COLORS.inkSoft,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: COLORS.ink,
      backgroundColor: COLORS.card,
    },
    inputError: {
      borderColor: COLORS.danger,
    },
    error: {
      marginTop: 4,
      fontSize: 12,
      color: COLORS.danger,
    },
  });
}

import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { COLORS } from '../theme/colors';

interface Props {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
}

export function PrimaryButton({ label, onPress, disabled, loading, variant = 'primary', style }: Props) {
  const isDisabled = disabled || loading;

  const backgroundColor =
    variant === 'primary' ? COLORS.brand : variant === 'danger' ? COLORS.dangerBg : COLORS.white;
  const textColor = variant === 'danger' ? COLORS.danger : variant === 'secondary' ? COLORS.ink : COLORS.white;
  const borderColor = variant === 'secondary' ? COLORS.line : 'transparent';

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={[
        styles.button,
        { backgroundColor, borderColor, opacity: isDisabled ? 0.5 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.label, { color: textColor }]}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
  },
});

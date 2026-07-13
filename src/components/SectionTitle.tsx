import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

export function SectionTitle({ children, small }: { children: React.ReactNode; small?: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Text style={[styles.title, small && styles.small]}>{children}</Text>;
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    title: {
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontWeight: '700',
      fontSize: 18,
      color: COLORS.ink,
    },
    small: { fontSize: 12 },
  });
}

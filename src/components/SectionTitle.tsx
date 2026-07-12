import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { COLORS } from '../theme/colors';

export function SectionTitle({ children, small }: { children: React.ReactNode; small?: boolean }) {
  return <Text style={[styles.title, small && styles.small]}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '700',
    fontSize: 18,
    color: COLORS.ink,
  },
  small: { fontSize: 12 },
});

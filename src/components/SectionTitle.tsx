import React, { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  children: React.ReactNode;
  small?: boolean;
  logo?: boolean;
}

export function SectionTitle({ children, small, logo }: Props) {
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const text = <Text style={[styles.title, small && styles.small]}>{children}</Text>;

  if (!logo) return text;

  return (
    <View style={styles.row}>
      <Image
        source={scheme === 'dark' ? require('../../assets/logo-mark-white.png') : require('../../assets/logo-mark.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      {text}
    </View>
  );
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
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    logo: { width: 22, height: 22 },
  });
}

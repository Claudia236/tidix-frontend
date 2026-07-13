import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import type { Item } from '../types';

interface Props {
  tone: 'critico' | 'attenzione';
  title: string;
  items: Item[];
  onItemPress: (item: Item) => void;
}

export function AlertBanner({ tone, title, items, onItemPress }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const color = tone === 'critico' ? colors.danger : colors.warn;
  const bg = tone === 'critico' ? colors.dangerBg : colors.warnBg;
  const shown = items.slice(0, 6);
  const extra = items.length - shown.length;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <View style={styles.header}>
        <Ionicons name="warning-outline" size={16} color={color} />
        <Text style={[styles.title, { color }]}>{title}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} contentContainerStyle={styles.chips}>
        {shown.map((item) => (
          <Pressable key={item.id} onPress={() => onItemPress(item)} style={styles.chip}>
            <Text style={[styles.chipText, { color }]}>{item.name}</Text>
          </Pressable>
        ))}
        {extra > 0 ? <Text style={[styles.chipText, { color, paddingHorizontal: 6 }]}>+{extra}</Text> : null}
      </ScrollView>
    </View>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    container: { borderRadius: 14, padding: 12, marginBottom: 8 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    title: { fontSize: 13, fontWeight: '700' },
    chipsScroll: { flexGrow: 0 },
    chips: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    chip: { backgroundColor: COLORS.card, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
    chipText: { fontSize: 12, fontWeight: '600' },
  });
}

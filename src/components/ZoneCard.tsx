import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme/colors';
import type { ZoneSummary } from '../types';

interface Props {
  summary: ZoneSummary;
  onPress: () => void;
}

export function ZoneCard({ summary, onPress }: Props) {
  const count = summary.count;
  const showDot = summary.hasExpired || summary.hasExpiring;

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.emoji}>{summary.emoji}</Text>
        {showDot ? (
          <View style={[styles.dot, { backgroundColor: summary.hasExpired ? COLORS.danger : COLORS.warn }]} />
        ) : null}
      </View>
      <Text style={styles.label}>{summary.name}</Text>
      <Text style={styles.count}>{count} prodott{count === 1 ? 'o' : 'i'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 12,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  emoji: { fontSize: 24 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { textTransform: 'uppercase', letterSpacing: 0.4, fontWeight: '700', fontSize: 13, color: COLORS.ink },
  count: { fontSize: 12, color: COLORS.inkSoft, marginTop: 2 },
});

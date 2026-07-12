import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ZONES } from '../constants/domain';
import { COLORS } from '../theme/colors';
import type { StorageZone, ZoneSummary } from '../types';

interface Props {
  zone: StorageZone;
  summary?: ZoneSummary;
  onPress: () => void;
}

export function ZoneCard({ zone, summary, onPress }: Props) {
  const zoneInfo = ZONES[zone];
  const count = summary?.count ?? 0;
  const showDot = summary?.hasExpired || summary?.hasExpiring;

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.emoji}>{zoneInfo.emoji}</Text>
        {showDot ? (
          <View style={[styles.dot, { backgroundColor: summary?.hasExpired ? COLORS.danger : COLORS.warn }]} />
        ) : null}
      </View>
      <Text style={styles.label}>{zoneInfo.label}</Text>
      <Text style={styles.count}>{count} prodott{count === 1 ? 'o' : 'i'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '48%',
    flexGrow: 1,
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

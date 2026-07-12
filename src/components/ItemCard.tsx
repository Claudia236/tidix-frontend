import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { categoryInfo, EXPIRY_STATUS_COLORS, ZONES } from '../constants/domain';
import { COLORS } from '../theme/colors';
import type { Item } from '../types';
import { getExpiryInfo } from '../utils/expiry';

interface Props {
  item: Item;
  onAdjust: (delta: number) => void;
  onPress: () => void;
}

export function ItemCard({ item, onAdjust, onPress }: Props) {
  const zone = ZONES[item.zone];
  const category = categoryInfo(item.category);
  const needsBuying = item.quantity <= 0;
  const expiry = !needsBuying ? getExpiryInfo(item.expirationDate) : null;

  let stripeColor: string = COLORS.line;
  let noteText: string | null = null;
  let noteColor: string = COLORS.inkSoft;

  if (needsBuying) {
    stripeColor = COLORS.danger;
    noteText = 'Da comprare';
    noteColor = COLORS.danger;
  } else if (expiry) {
    stripeColor = EXPIRY_STATUS_COLORS[expiry.status].fg;
    noteText = expiry.label;
    noteColor = EXPIRY_STATUS_COLORS[expiry.status].fg;
  }

  return (
    <View style={styles.card}>
      <View style={[styles.stripe, { backgroundColor: stripeColor }]} />
      <View style={styles.body}>
        <Pressable onPress={onPress} style={styles.pressableInfo}>
          <Text style={styles.emoji}>{category.emoji}</Text>
          <View style={styles.info}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <View style={[styles.zoneBadge, { backgroundColor: zone.bg }]}>
                <Text style={[styles.zoneBadgeText, { color: zone.color }]}>{zone.code}</Text>
              </View>
            </View>
            {noteText ? <Text style={[styles.note, { color: noteColor }]}>{noteText}</Text> : null}
          </View>
        </Pressable>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => onAdjust(-1)}
            disabled={item.quantity <= 0}
            style={[styles.stepperButton, item.quantity <= 0 && styles.stepperButtonDisabled]}
          >
            <Ionicons name="remove" size={14} color={COLORS.ink} />
          </Pressable>
          <Text style={styles.quantity}>
            {formatQuantity(item.quantity)}{item.unit ? ` ${item.unit.toLowerCase()}` : ''}
          </Text>
          <Pressable onPress={() => onAdjust(1)} style={styles.stepperButton}>
            <Ionicons name="add" size={14} color={COLORS.ink} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function formatQuantity(quantity: number): string {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2).replace(/\.?0+$/, '');
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    overflow: 'hidden',
    marginBottom: 8,
  },
  stripe: { width: 5 },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingRight: 12, gap: 8 },
  pressableInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 12, minWidth: 0 },
  emoji: { fontSize: 20 },
  info: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  name: { fontWeight: '700', fontSize: 14, color: COLORS.ink, flexShrink: 1 },
  zoneBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  zoneBadgeText: { fontSize: 10, fontWeight: '700' },
  note: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepperButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperButtonDisabled: { opacity: 0.3 },
  quantity: {
    fontVariant: ['tabular-nums'],
    fontWeight: '700',
    fontSize: 13,
    color: COLORS.ink,
    minWidth: 40,
    textAlign: 'center',
  },
});

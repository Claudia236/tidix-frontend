import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCategoryInfo, useExpiryStatusColors, useLocationColor, locationCode } from '../constants/domain';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import type { Item, StorageLocation } from '../types';
import { formatShortDate, getExpiryInfo } from '../utils/expiry';

interface Props {
  item: Item;
  location: StorageLocation | undefined;
  onAdjust: (delta: number) => void;
  onPress: () => void;
}

export function ItemCard({ item, location, onAdjust, onPress }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const category = useCategoryInfo(item.category);
  const expiryStatusColors = useExpiryStatusColors();
  const getLocationColor = useLocationColor();

  const needsBuying = item.quantity <= 0;
  const expiry = !needsBuying ? getExpiryInfo(item.expirationDate) : null;
  const { color: locationFg, bg: locationBg } = getLocationColor(item.storageLocationId);

  let stripeColor: string = colors.line;
  let noteText: string | null = null;
  let noteColor: string = colors.inkSoft;

  if (needsBuying) {
    stripeColor = colors.danger;
    noteText = t('itemCard.needsBuying');
    noteColor = colors.danger;
  } else if (expiry) {
    stripeColor = expiryStatusColors[expiry.status].fg;
    noteText = expiry.label;
    noteColor = expiryStatusColors[expiry.status].fg;
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
              {location ? (
                <View style={[styles.zoneBadge, { backgroundColor: locationBg }]}>
                  <Text style={[styles.zoneBadgeText, { color: locationFg }]}>{locationCode(location.name)}</Text>
                </View>
              ) : null}
              {item.opened ? (
                <View style={styles.openedBadge}>
                  <Ionicons name="lock-open-outline" size={10} color={colors.gold} />
                </View>
              ) : null}
            </View>
            {noteText ? <Text style={[styles.note, { color: noteColor }]}>{noteText}</Text> : null}
            {item.opened && item.openedDate ? (
              <Text style={styles.openedNote}>{t('itemCard.openedOn', { date: formatShortDate(item.openedDate) })}</Text>
            ) : null}
          </View>
        </Pressable>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => onAdjust(-1)}
            disabled={item.quantity <= 0}
            style={[styles.stepperButton, item.quantity <= 0 && styles.stepperButtonDisabled]}
          >
            <Ionicons name="remove" size={14} color={colors.ink} />
          </Pressable>
          <Text style={styles.quantity}>
            {formatQuantity(item.quantity)}{item.unit ? ` ${item.unit.toLowerCase()}` : ''}
          </Text>
          <Pressable onPress={() => onAdjust(1)} style={styles.stepperButton}>
            <Ionicons name="add" size={14} color={colors.ink} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function formatQuantity(quantity: number): string {
  return Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2).replace(/\.?0+$/, '');
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: COLORS.card,
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
    openedBadge: {
      width: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: COLORS.goldBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    note: { fontSize: 12, fontWeight: '600', marginTop: 2 },
    openedNote: { fontSize: 11, color: COLORS.gold, marginTop: 2 },
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
}

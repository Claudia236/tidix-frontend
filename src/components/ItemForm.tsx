import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CATEGORIES, UNITS, ZONE_ORDER, ZONES } from '../constants/domain';
import { COLORS } from '../theme/colors';
import type { Category, ItemInput, StorageZone, Unit } from '../types';
import { PrimaryButton } from './PrimaryButton';
import { TextField } from './TextField';

interface Props {
  initial?: Partial<ItemInput>;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (input: ItemInput) => void;
  onDelete?: () => void;
  deleting?: boolean;
}

export function ItemForm({ initial, submitLabel, submitting, onSubmit, onDelete, deleting }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [zone, setZone] = useState<StorageZone>(initial?.zone ?? 'FRIGO');
  const [category, setCategory] = useState<Category>(initial?.category ?? 'ALTRO');
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? 1));
  const [unit, setUnit] = useState<Unit>(initial?.unit ?? 'PZ');
  const [expirationDate, setExpirationDate] = useState<string | null>(initial?.expirationDate ?? null);
  const [showPicker, setShowPicker] = useState(false);

  const canSubmit = name.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      zone,
      category,
      quantity: Math.max(0, Number(quantity.replace(',', '.')) || 0),
      unit,
      expirationDate,
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TextField label="Nome prodotto" placeholder="Es. Latte intero" value={name} onChangeText={setName} autoFocus />

      <View style={styles.field}>
        <Text style={styles.label}>Dove si trova</Text>
        <View style={styles.grid}>
          {ZONE_ORDER.map((key) => {
            const info = ZONES[key];
            const active = zone === key;
            return (
              <Pressable
                key={key}
                onPress={() => setZone(key)}
                style={[styles.zoneChip, { borderColor: active ? info.color : COLORS.line, backgroundColor: active ? info.color : COLORS.white }]}
              >
                <Text style={{ fontSize: 14 }}>{info.emoji}</Text>
                <Text style={[styles.chipText, { color: active ? COLORS.white : COLORS.ink }]}>{info.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Categoria</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {CATEGORIES.map((cat) => {
            const active = category === cat.key;
            return (
              <Pressable
                key={cat.key}
                onPress={() => setCategory(cat.key)}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
              >
                <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
                <Text style={styles.categoryChipText}>{cat.short}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <TextField
            label="Quantità"
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Unità</Text>
          <View style={styles.unitRow}>
            {UNITS.map((u) => {
              const active = unit === u;
              return (
                <Pressable
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[styles.unitChip, active && styles.unitChipActive]}
                >
                  <Text style={[styles.unitChipText, active && { color: COLORS.white }]}>{u.toLowerCase()}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Scadenza (opzionale)</Text>
        <Pressable style={styles.dateButton} onPress={() => setShowPicker(true)}>
          <Ionicons name="calendar-outline" size={16} color={COLORS.ink} />
          <Text style={styles.dateButtonText}>{expirationDate ?? 'Nessuna scadenza'}</Text>
        </Pressable>
        {expirationDate ? (
          <Pressable onPress={() => setExpirationDate(null)}>
            <Text style={styles.clearDate}>Rimuovi scadenza</Text>
          </Pressable>
        ) : null}
        {showPicker ? (
          <DateTimePicker
            value={expirationDate ? new Date(`${expirationDate}T00:00:00`) : new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(event, date) => {
              setShowPicker(Platform.OS === 'ios');
              if (event.type === 'dismissed') {
                setShowPicker(false);
                return;
              }
              if (date) {
                setExpirationDate(date.toISOString().slice(0, 10));
              }
              if (Platform.OS === 'android') setShowPicker(false);
            }}
          />
        ) : null}
      </View>

      <View style={styles.actions}>
        {onDelete ? (
          <PrimaryButton label="Elimina" variant="danger" onPress={onDelete} loading={deleting} style={{ flex: 0 }} />
        ) : null}
        <PrimaryButton label={submitLabel} onPress={handleSubmit} disabled={!canSubmit} loading={submitting} style={{ flex: 1 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 20, paddingBottom: 40 },
  field: { gap: 8 },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: COLORS.inkSoft,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  zoneChip: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chipText: { fontWeight: '600', fontSize: 13 },
  categoryRow: { gap: 8, paddingVertical: 2 },
  categoryChip: {
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 64,
    backgroundColor: COLORS.white,
  },
  categoryChipActive: { borderColor: COLORS.brand, backgroundColor: COLORS.okBg },
  categoryChipText: { fontSize: 11, color: COLORS.ink },
  row: { flexDirection: 'row', gap: 12 },
  unitRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  unitChip: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: COLORS.white,
  },
  unitChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  unitChipText: { fontSize: 12, fontWeight: '600', color: COLORS.ink },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
  },
  dateButtonText: { fontSize: 14, color: COLORS.ink },
  clearDate: { fontSize: 12, color: COLORS.danger, marginTop: 6, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
});

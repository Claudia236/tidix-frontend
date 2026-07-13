import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { storageLocationsApi } from '../api/storageLocations';
import { CATEGORIES, locationColor, UNITS } from '../constants/domain';
import { useStorageLocations } from '../hooks/useStorageLocations';
import { COLORS } from '../theme/colors';
import { webCentered } from '../theme/responsive';
import type { Category, ItemInput, Unit } from '../types';
import { DatePickerField } from './DatePickerField';
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
  const queryClient = useQueryClient();
  const { locations } = useStorageLocations();

  const [name, setName] = useState(initial?.name ?? '');
  const [storageLocationId, setStorageLocationId] = useState<string>(initial?.storageLocationId ?? '');
  const [category, setCategory] = useState<Category>(initial?.category ?? 'ALTRO');
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? 1));
  const [unit, setUnit] = useState<Unit>(initial?.unit ?? 'PZ');
  const [expirationDate, setExpirationDate] = useState<string | null>(initial?.expirationDate ?? null);
  const [purchaseDate, setPurchaseDate] = useState<string | null>(
    initial?.purchaseDate ?? new Date().toISOString().slice(0, 10)
  );
  const [opened, setOpened] = useState(initial?.opened ?? false);
  const [openedDate, setOpenedDate] = useState<string | null>(
    initial?.openedDate ?? new Date().toISOString().slice(0, 10)
  );
  const [addingLocation, setAddingLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationEmoji, setNewLocationEmoji] = useState('');

  const effectiveLocationId = storageLocationId || locations[0]?.id || '';

  const createLocationMutation = useMutation({
    mutationFn: () => storageLocationsApi.create({ name: newLocationName.trim(), emoji: newLocationEmoji.trim() || undefined }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['storage-locations'] });
      setStorageLocationId(created.id);
      setNewLocationName('');
      setNewLocationEmoji('');
      setAddingLocation(false);
    },
  });

  const canSubmit = name.trim().length > 0 && !!effectiveLocationId;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit({
      name: name.trim(),
      storageLocationId: effectiveLocationId,
      category,
      quantity: Math.max(0, Number(quantity.replace(',', '.')) || 0),
      unit,
      expirationDate,
      purchaseDate,
      opened,
      openedDate: opened ? openedDate : null,
    });
  }

  function handleCreateLocation() {
    if (!newLocationName.trim()) return;
    createLocationMutation.mutate();
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TextField label="Nome prodotto" placeholder="Es. Latte intero" value={name} onChangeText={setName} autoFocus />

      <View style={styles.field}>
        <Text style={styles.label}>Dove si trova</Text>
        <View style={styles.grid}>
          {locations.map((location) => {
            const active = effectiveLocationId === location.id;
            const { color } = locationColor(location.id);
            return (
              <Pressable
                key={location.id}
                onPress={() => setStorageLocationId(location.id)}
                style={[styles.zoneChip, { borderColor: active ? color : COLORS.line, backgroundColor: active ? color : COLORS.white }]}
              >
                <Text style={{ fontSize: 14 }}>{location.emoji}</Text>
                <Text style={[styles.chipText, { color: active ? COLORS.white : COLORS.ink }]}>{location.name}</Text>
              </Pressable>
            );
          })}
          <Pressable onPress={() => setAddingLocation(true)} style={[styles.zoneChip, styles.addLocationChip]}>
            <Ionicons name="add" size={16} color={COLORS.brand} />
            <Text style={[styles.chipText, { color: COLORS.brand }]}>Nuova posizione</Text>
          </Pressable>
        </View>

        {addingLocation ? (
          <View style={styles.newLocationRow}>
            <TextInput
              value={newLocationEmoji}
              onChangeText={(v) => setNewLocationEmoji(Array.from(v).slice(0, 1).join(''))}
              placeholder="📦"
              placeholderTextColor={COLORS.inkSoft}
              style={styles.newLocationEmojiInput}
            />
            <TextInput
              value={newLocationName}
              onChangeText={setNewLocationName}
              placeholder="Es. Cantina"
              placeholderTextColor={COLORS.inkSoft}
              style={styles.newLocationInput}
              autoFocus
              onSubmitEditing={handleCreateLocation}
            />
            <Pressable onPress={handleCreateLocation} style={styles.newLocationButton} hitSlop={8}>
              <Ionicons name="checkmark" size={16} color={COLORS.white} />
            </Pressable>
            <Pressable onPress={() => setAddingLocation(false)} style={styles.newLocationCancel} hitSlop={8}>
              <Ionicons name="close" size={16} color={COLORS.inkSoft} />
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Categoria</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryRow}
        >
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
        <Text style={styles.label}>Data di acquisto</Text>
        <DatePickerField value={purchaseDate} onChange={setPurchaseDate} allowClear={false} />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Scadenza (opzionale)</Text>
        <DatePickerField value={expirationDate} onChange={setExpirationDate} />
      </View>

      <View style={styles.field}>
        <Pressable onPress={() => setOpened((v) => !v)} style={styles.openedToggle}>
          <Ionicons name={opened ? 'checkbox' : 'square-outline'} size={18} color={COLORS.brand} />
          <Text style={styles.openedToggleText}>Confezione già aperta</Text>
        </Pressable>
        {opened ? (
          <>
            <Text style={styles.label}>Aperta il</Text>
            <DatePickerField value={openedDate} onChange={setOpenedDate} allowClear={false} />
          </>
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
  container: { padding: 20, gap: 20, paddingBottom: 40, ...webCentered },
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
  addLocationChip: { borderColor: COLORS.brand, borderStyle: 'dashed', backgroundColor: COLORS.white },
  chipText: { fontWeight: '600', fontSize: 13 },
  newLocationRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 },
  newLocationEmojiInput: {
    width: 44,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 8,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: COLORS.white,
  },
  newLocationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.ink,
    backgroundColor: COLORS.white,
  },
  newLocationButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newLocationCancel: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryScroll: { flexGrow: 0 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 },
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
  openedToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  openedToggleText: { fontSize: 13, color: COLORS.ink },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
});

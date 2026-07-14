import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { storageLocationsApi } from '../api/storageLocations';
import { CONSUME_WITHIN_DAYS_CATEGORIES, useSelectableCategories, useLocationColor, useUnitLabel, UNITS } from '../constants/domain';
import { useStorageLocations } from '../hooks/useStorageLocations';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { webCentered } from '../theme/responsive';
import type { Category, ItemInput, Unit } from '../types';
import { daysUntil, toLocalISODate, todayLocalISODate } from '../utils/expiry';
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
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const { locations } = useStorageLocations();
  const categories = useSelectableCategories();
  const unitLabel = useUnitLabel();
  const getLocationColor = useLocationColor();

  const [name, setName] = useState(initial?.name ?? '');
  const [storageLocationId, setStorageLocationId] = useState<string>(initial?.storageLocationId ?? '');
  const [category, setCategory] = useState<Category>(initial?.category ?? 'ALTRO');
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? 1));
  const [unit, setUnit] = useState<Unit>(initial?.unit ?? 'PZ');
  const [expirationDate, setExpirationDate] = useState<string | null>(initial?.expirationDate ?? null);
  const [consumeWithinDays, setConsumeWithinDays] = useState<string>(() => {
    if (!initial?.expirationDate || !CONSUME_WITHIN_DAYS_CATEGORIES.has(initial?.category ?? 'ALTRO')) return '';
    return String(Math.max(0, daysUntil(initial.expirationDate)));
  });
  const [purchaseDate, setPurchaseDate] = useState<string | null>(
    initial?.purchaseDate ?? todayLocalISODate()
  );
  const [opened, setOpened] = useState(initial?.opened ?? false);
  const [openedDate, setOpenedDate] = useState<string | null>(
    initial?.openedDate ?? todayLocalISODate()
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
  const usesConsumeWithinDays = CONSUME_WITHIN_DAYS_CATEGORIES.has(category);

  function handleSubmit() {
    if (!canSubmit) return;
    let resolvedExpirationDate = expirationDate;
    if (usesConsumeWithinDays) {
      const days = Number(consumeWithinDays.trim());
      if (consumeWithinDays.trim() && Number.isFinite(days) && days >= 0) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        resolvedExpirationDate = toLocalISODate(date);
      } else {
        resolvedExpirationDate = null;
      }
    }
    onSubmit({
      name: name.trim(),
      storageLocationId: effectiveLocationId,
      category,
      quantity: Math.max(0, Number(quantity.replace(',', '.')) || 0),
      unit,
      expirationDate: resolvedExpirationDate,
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
      <TextField label={t('itemForm.name.label')} placeholder={t('itemForm.name.placeholder')} value={name} onChangeText={setName} autoFocus />

      <View style={styles.field}>
        <Text style={styles.label}>{t('itemForm.location.label')}</Text>
        <View style={styles.grid}>
          {locations.map((location) => {
            const active = effectiveLocationId === location.id;
            const { color } = getLocationColor(location.id);
            return (
              <Pressable
                key={location.id}
                onPress={() => setStorageLocationId(location.id)}
                style={[styles.zoneChip, { borderColor: active ? color : colors.line, backgroundColor: active ? color : colors.card }]}
              >
                <Text style={{ fontSize: 14 }}>{location.emoji}</Text>
                <Text style={[styles.chipText, { color: active ? colors.white : colors.ink }]}>{location.name}</Text>
              </Pressable>
            );
          })}
          <Pressable onPress={() => setAddingLocation(true)} style={[styles.zoneChip, styles.addLocationChip]}>
            <Ionicons name="add" size={16} color={colors.brand} />
            <Text style={[styles.chipText, { color: colors.brand }]}>{t('itemForm.newLocation')}</Text>
          </Pressable>
        </View>

        {addingLocation ? (
          <View style={styles.newLocationRow}>
            <TextInput
              value={newLocationEmoji}
              onChangeText={(v) => setNewLocationEmoji(Array.from(v).slice(0, 1).join(''))}
              placeholder="📦"
              placeholderTextColor={colors.inkSoft}
              style={styles.newLocationEmojiInput}
            />
            <TextInput
              value={newLocationName}
              onChangeText={setNewLocationName}
              placeholder={t('itemForm.newLocation.namePlaceholder')}
              placeholderTextColor={colors.inkSoft}
              style={styles.newLocationInput}
              autoFocus
              onSubmitEditing={handleCreateLocation}
            />
            <Pressable onPress={handleCreateLocation} style={styles.newLocationButton} hitSlop={8}>
              <Ionicons name="checkmark" size={16} color={colors.white} />
            </Pressable>
            <Pressable onPress={() => setAddingLocation(false)} style={styles.newLocationCancel} hitSlop={8}>
              <Ionicons name="close" size={16} color={colors.inkSoft} />
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('itemForm.category.label')}</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryRow}
        >
          {categories.map((cat) => {
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
            label={t('itemForm.quantity.label')}
            keyboardType="numeric"
            value={quantity}
            onChangeText={setQuantity}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{t('itemForm.unit.label')}</Text>
          <View style={styles.unitRow}>
            {UNITS.map((u) => {
              const active = unit === u;
              return (
                <Pressable
                  key={u}
                  onPress={() => setUnit(u)}
                  style={[styles.unitChip, active && styles.unitChipActive]}
                >
                  <Text style={[styles.unitChipText, active && { color: colors.white }]}>{unitLabel(u)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>{t('itemForm.purchaseDate.label')}</Text>
        <DatePickerField value={purchaseDate} onChange={setPurchaseDate} allowClear={false} />
      </View>

      <View style={styles.field}>
        {usesConsumeWithinDays ? (
          <>
            <TextField
              label={t('itemForm.consumeWithinDays.label')}
              placeholder={t('itemForm.consumeWithinDays.placeholder')}
              keyboardType="numeric"
              value={consumeWithinDays}
              onChangeText={setConsumeWithinDays}
            />
            <Text style={styles.consumeWithinDaysHint}>{t('itemForm.consumeWithinDays.hint')}</Text>
          </>
        ) : (
          <>
            <Text style={styles.label}>{t('itemForm.expirationDate.label')}</Text>
            <DatePickerField value={expirationDate} onChange={setExpirationDate} />
          </>
        )}
      </View>

      <View style={styles.field}>
        <Pressable onPress={() => setOpened((v) => !v)} style={styles.openedToggle}>
          <Ionicons name={opened ? 'checkbox' : 'square-outline'} size={18} color={colors.brand} />
          <Text style={styles.openedToggleText}>{t('itemForm.openedToggle')}</Text>
        </Pressable>
        {opened ? (
          <>
            <Text style={styles.label}>{t('itemForm.openedDate.label')}</Text>
            <DatePickerField value={openedDate} onChange={setOpenedDate} allowClear={false} />
          </>
        ) : null}
      </View>

      <View style={styles.actions}>
        {onDelete ? (
          <PrimaryButton label={t('common.delete')} variant="danger" onPress={onDelete} loading={deleting} style={{ flex: 0 }} />
        ) : null}
        <PrimaryButton label={submitLabel} onPress={handleSubmit} disabled={!canSubmit} loading={submitting} style={{ flex: 1 }} />
      </View>
    </ScrollView>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
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
    addLocationChip: { borderColor: COLORS.brand, borderStyle: 'dashed', backgroundColor: COLORS.card },
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
      backgroundColor: COLORS.card,
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
      backgroundColor: COLORS.card,
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
      backgroundColor: COLORS.card,
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
      backgroundColor: COLORS.card,
    },
    unitChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
    unitChipText: { fontSize: 12, fontWeight: '600', color: COLORS.ink },
    consumeWithinDaysHint: { fontSize: 11, color: COLORS.inkSoft, marginTop: -4 },
    openedToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    openedToggleText: { fontSize: 13, color: COLORS.ink },
    actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  });
}

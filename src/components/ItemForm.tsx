import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import * as ImagePicker from 'expo-image-picker';
import React, { forwardRef, useImperativeHandle, useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { storageLocationsApi } from '../api/storageLocations';
import { CONSUME_WITHIN_DAYS_CATEGORIES, useSelectableCategories, useLocationColor, useUnitLabel, UNITS } from '../constants/domain';
import { useStorageLocations } from '../hooks/useStorageLocations';
import { useVoiceDictation } from '../hooks/useVoiceDictation';
import type { TranslateFn } from '../i18n/I18nContext';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { webCentered } from '../theme/responsive';
import type { Category, ItemInput, Unit } from '../types';
import { daysUntil, toLocalISODate, todayLocalISODate } from '../utils/expiry';
import { parseExpirationDate, parseProductName } from '../utils/productLabelParser';
import { parseSpokenDateIT } from '../utils/voiceDate';
import { showAlert } from './AppAlert';
import { DatePickerField } from './DatePickerField';
import { PrimaryButton } from './PrimaryButton';
import { SupermarketPicker } from './SupermarketPicker';
import { TextField } from './TextField';

type VoiceTarget = 'name' | 'expiration';
type ConsumeWithinUnit = 'giorni' | 'mesi';
type ExpiryMode = 'date' | 'consumeWithin';

const MAX_SCAN_PHOTOS = 2;

interface Props {
  initial?: Partial<ItemInput>;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (input: ItemInput) => void;
  onDelete?: () => void;
  deleting?: boolean;
  enableScan?: boolean;
}

export interface ItemFormHandle {
  openScan: () => void;
}

function computeDaysBetween(amount: number, unit: ConsumeWithinUnit, baseDateStr: string): number {
  const base = new Date(`${baseDateStr}T00:00:00`);
  const target = new Date(base);
  if (unit === 'mesi') target.setMonth(target.getMonth() + amount);
  else target.setDate(target.getDate() + amount);
  return Math.max(1, Math.round((target.getTime() - base.getTime()) / 86_400_000));
}

interface ConsumeWithinFieldsProps {
  colors: ColorPalette;
  t: TranslateFn;
  styles: ReturnType<typeof createStyles>;
  label: string;
  amount: string;
  onChangeAmount: (text: string) => void;
  unit: ConsumeWithinUnit;
  onSelectUnit: (u: ConsumeWithinUnit) => void;
  hint: string;
  guideOnPress?: () => void;
  voice?: { active: boolean; onPress: () => void };
}

function ConsumeWithinFields({
  colors,
  t,
  styles,
  label,
  amount,
  onChangeAmount,
  unit,
  onSelectUnit,
  hint,
  guideOnPress,
  voice,
}: ConsumeWithinFieldsProps) {
  const labelExtra =
    guideOnPress || voice ? (
      <View style={styles.voiceLabelRow}>
        {guideOnPress ? (
          <Pressable hitSlop={8} onPress={guideOnPress}>
            <Ionicons name="information-circle-outline" size={16} color={colors.brand} />
          </Pressable>
        ) : null}
        {voice ? (
          <Pressable onPress={voice.onPress} hitSlop={8}>
            <Ionicons name={voice.active ? 'mic' : 'mic-outline'} size={16} color={voice.active ? colors.danger : colors.brand} />
          </Pressable>
        ) : null}
      </View>
    ) : undefined;

  return (
    <>
      <View style={styles.consumeWithinRow}>
        <View style={{ flex: 1 }}>
          <TextField
            label={label}
            labelExtra={labelExtra}
            placeholder={t('itemForm.consumeWithin.placeholder')}
            keyboardType="numeric"
            value={amount}
            onChangeText={onChangeAmount}
          />
        </View>
        <View style={styles.consumeWithinUnitGroup}>
          <Pressable
            onPress={() => onSelectUnit('giorni')}
            style={[styles.consumeWithinUnitChip, unit === 'giorni' && styles.consumeWithinUnitChipActive]}
          >
            <Text style={[styles.consumeWithinUnitChipText, unit === 'giorni' && { color: colors.white }]}>
              {t('itemForm.consumeWithin.unitDays')}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => onSelectUnit('mesi')}
            style={[styles.consumeWithinUnitChip, unit === 'mesi' && styles.consumeWithinUnitChipActive]}
          >
            <Text style={[styles.consumeWithinUnitChipText, unit === 'mesi' && { color: colors.white }]}>
              {t('itemForm.consumeWithin.unitMonths')}
            </Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.consumeWithinDaysHint}>{hint}</Text>
    </>
  );
}

export const ItemForm = forwardRef<ItemFormHandle, Props>(function ItemForm(
  { initial, submitLabel, submitting, onSubmit, onDelete, deleting, enableScan },
  ref
) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const { locations } = useStorageLocations();
  const categories = useSelectableCategories();
  const unitLabel = useUnitLabel();
  const getLocationColor = useLocationColor();

  const [name, setName] = useState(initial?.name ?? '');
  const [storageLocationId, setStorageLocationId] = useState<string>(initial?.storageLocationId ?? '');
  const [supermarketId, setSupermarketId] = useState<string | null>(initial?.supermarketId ?? null);
  const [category, setCategory] = useState<Category>(initial?.category ?? 'ALTRO');
  const [quantity, setQuantity] = useState(String(initial?.quantity ?? 1));
  const [unit, setUnit] = useState<Unit>(initial?.unit ?? 'PZ');
  const [expirationDate, setExpirationDate] = useState<string | null>(initial?.expirationDate ?? null);
  const [consumeWithinAmount, setConsumeWithinAmount] = useState<string>(() => {
    if (!initial?.expirationDate || initial?.category !== 'AVANZI') return '';
    return String(Math.max(0, daysUntil(initial.expirationDate)));
  });
  const [consumeWithinUnit, setConsumeWithinUnit] = useState<ConsumeWithinUnit>('giorni');
  const [consumeWithinUnitTouched, setConsumeWithinUnitTouched] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState<string | null>(
    initial?.purchaseDate ?? todayLocalISODate()
  );
  const [opened, setOpened] = useState(initial?.opened ?? false);
  const [openedDate, setOpenedDate] = useState<string | null>(
    initial?.openedDate ?? todayLocalISODate()
  );
  const [openedConsumeWithinAmount, setOpenedConsumeWithinAmount] = useState<string>(() =>
    initial?.openedReminderEnabled && initial?.openedReminderDays ? String(initial.openedReminderDays) : ''
  );
  const [openedConsumeWithinUnit, setOpenedConsumeWithinUnit] = useState<ConsumeWithinUnit>('giorni');
  const [addingLocation, setAddingLocation] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationEmoji, setNewLocationEmoji] = useState('');
  const [expiryMode, setExpiryMode] = useState<ExpiryMode>('date');
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [scanModalVisible, setScanModalVisible] = useState(false);

  useImperativeHandle(ref, () => ({ openScan: () => setScanModalVisible(true) }), []);
  const [scanPhotos, setScanPhotos] = useState<string[]>([]);
  const [scanRecognizing, setScanRecognizing] = useState(false);

  const isAvanzi = category === 'AVANZI';
  const replacesExpirationWithConsumeWithin = isAvanzi;

  const voice = useVoiceDictation<VoiceTarget>((voiceTarget, transcript) => {
    if (voiceTarget === 'name') {
      setName(transcript.charAt(0).toUpperCase() + transcript.slice(1));
    } else if (voiceTarget === 'expiration') {
      const parsed = parseSpokenDateIT(transcript);
      if (!parsed) {
        showAlert(t('common.error'), t('itemForm.voice.dateNotUnderstood', { text: transcript }));
      } else if (replacesExpirationWithConsumeWithin || expiryMode === 'consumeWithin') {
        setConsumeWithinUnit('giorni');
        setConsumeWithinUnitTouched(true);
        handleConsumeWithinAmountChange(String(Math.max(0, daysUntil(parsed))), 'giorni');
      } else {
        setExpirationDate(parsed);
      }
    }
  });

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

  const selectedCategoryInfo = categories.find((c) => c.key === category) ?? categories[categories.length - 1];
  const canSubmit = name.trim().length > 0 && !!effectiveLocationId;
  const hidesExpiration = category === 'CASA_PULIZIA';
  const hidesOpenedToggle = hidesExpiration || replacesExpirationWithConsumeWithin;
  const isFreezerLocation = (locations.find((l) => l.id === effectiveLocationId)?.name ?? '').trim().toLowerCase() === 'freezer';
  const showsExpiryModeToggle = !replacesExpirationWithConsumeWithin && !hidesExpiration;
  const showsConsumeWithinGuide = CONSUME_WITHIN_DAYS_CATEGORIES.has(category);
  const consumeWithinDefaultUnit: ConsumeWithinUnit = isFreezerLocation ? 'mesi' : 'giorni';
  const effectiveConsumeWithinUnit = consumeWithinUnitTouched ? consumeWithinUnit : consumeWithinDefaultUnit;

  function handleConsumeWithinAmountChange(text: string, unitOverride?: ConsumeWithinUnit) {
    setConsumeWithinAmount(text);
    if (replacesExpirationWithConsumeWithin) return;
    const amount = Number(text.trim().replace(',', '.'));
    if (!text.trim() || !Number.isFinite(amount) || amount < 0) return;
    const unitToUse = unitOverride ?? effectiveConsumeWithinUnit;
    const base = new Date(`${purchaseDate ?? todayLocalISODate()}T00:00:00`);
    if (unitToUse === 'mesi') base.setMonth(base.getMonth() + amount);
    else base.setDate(base.getDate() + amount);
    setExpirationDate(toLocalISODate(base));
  }

  function selectConsumeWithinUnit(u: ConsumeWithinUnit) {
    setConsumeWithinUnit(u);
    setConsumeWithinUnitTouched(true);
    if (!replacesExpirationWithConsumeWithin) handleConsumeWithinAmountChange(consumeWithinAmount, u);
  }

  function handleSubmit() {
    if (!canSubmit) return;
    let resolvedExpirationDate = expirationDate;
    if (hidesExpiration) {
      resolvedExpirationDate = null;
    } else if (replacesExpirationWithConsumeWithin) {
      const amount = Number(consumeWithinAmount.trim().replace(',', '.'));
      if (consumeWithinAmount.trim() && Number.isFinite(amount) && amount >= 0) {
        const date = new Date();
        if (effectiveConsumeWithinUnit === 'mesi') date.setMonth(date.getMonth() + amount);
        else date.setDate(date.getDate() + amount);
        resolvedExpirationDate = toLocalISODate(date);
      } else {
        resolvedExpirationDate = null;
      }
    }

    const effectiveOpened = !hidesOpenedToggle && opened;
    let resolvedOpenedReminderEnabled = false;
    let resolvedOpenedReminderDays = 3;
    if (effectiveOpened) {
      const amount = Number(openedConsumeWithinAmount.trim().replace(',', '.'));
      if (openedConsumeWithinAmount.trim() && Number.isFinite(amount) && amount > 0) {
        resolvedOpenedReminderEnabled = true;
        resolvedOpenedReminderDays = computeDaysBetween(amount, openedConsumeWithinUnit, openedDate ?? todayLocalISODate());
      }
    }

    onSubmit({
      name: name.trim(),
      storageLocationId: effectiveLocationId,
      supermarketId,
      category,
      quantity: Math.max(0, Number(quantity.replace(',', '.')) || 0),
      unit,
      expirationDate: resolvedExpirationDate,
      purchaseDate,
      opened: effectiveOpened,
      openedDate: effectiveOpened ? openedDate : null,
      openedReminderEnabled: resolvedOpenedReminderEnabled,
      openedReminderDays: resolvedOpenedReminderDays,
    });
  }

  function handleToggleOpened() {
    setOpened((prev) => !prev);
  }

  function handleCreateLocation() {
    if (!newLocationName.trim()) return;
    createLocationMutation.mutate();
  }

  function closeScanModal() {
    setScanModalVisible(false);
    setScanPhotos([]);
  }

  async function addScanPhoto(source: 'camera' | 'gallery') {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showAlert(t('common.error'), t('scanProduct.cameraPermissionDenied'));
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.7 });
      if (!result.canceled && result.assets[0]) {
        setScanPhotos((prev) => [...prev, result.assets[0].uri].slice(0, MAX_SCAN_PHOTOS));
      }
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showAlert(t('common.error'), t('scanProduct.libraryPermissionDenied'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7 });
      if (!result.canceled && result.assets[0]) {
        setScanPhotos((prev) => [...prev, result.assets[0].uri].slice(0, MAX_SCAN_PHOTOS));
      }
    }
  }

  function removeScanPhoto(uri: string) {
    setScanPhotos((prev) => prev.filter((p) => p !== uri));
  }

  async function runScan() {
    if (scanPhotos.length === 0) return;
    setScanRecognizing(true);
    try {
      const texts = await Promise.all(scanPhotos.map((uri) => TextRecognition.recognize(uri)));
      const combinedText = texts.map((r) => r.text).join('\n');
      const recognizedName = parseProductName(combinedText);
      const recognizedDate = parseExpirationDate(combinedText);

      if (!recognizedName && !recognizedDate) {
        showAlert(t('common.error'), t('scanProduct.noDataFound'));
        return;
      }

      if (recognizedName) setName(recognizedName);
      if (recognizedDate) {
        if (replacesExpirationWithConsumeWithin || expiryMode === 'consumeWithin') {
          setConsumeWithinUnit('giorni');
          setConsumeWithinUnitTouched(true);
          handleConsumeWithinAmountChange(String(Math.max(0, daysUntil(recognizedDate))), 'giorni');
        } else {
          setExpirationDate(recognizedDate);
        }
      }
      closeScanModal();
      showAlert(t('scanProduct.resultTitle'), t('scanProduct.resultMessage'));
    } catch {
      showAlert(t('common.error'), t('scanProduct.recognizeError'));
    } finally {
      setScanRecognizing(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView
        contentContainerStyle={[styles.container, { paddingBottom: 40 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          label={t('itemForm.name.label')}
          placeholder={t('itemForm.name.placeholder')}
          value={name}
          onChangeText={setName}
          autoFocus
          labelExtra={
            voice.available ? (
              <Pressable onPress={() => voice.start('name')} hitSlop={8}>
                <Ionicons
                  name={voice.target === 'name' ? 'mic' : 'mic-outline'}
                  size={16}
                  color={voice.target === 'name' ? colors.danger : colors.brand}
                />
              </Pressable>
            ) : null
          }
        />

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

      <SupermarketPicker value={supermarketId} onChange={setSupermarketId} label={t('itemForm.supermarket.label')} />

      <View style={styles.field}>
        <Text style={styles.label}>{t('itemForm.category.label')}</Text>
        <Pressable style={styles.trigger} onPress={() => setCategoryModalVisible(true)}>
          <Text style={{ fontSize: 16 }}>{selectedCategoryInfo.emoji}</Text>
          <Text style={styles.triggerText}>{selectedCategoryInfo.label}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.inkSoft} />
        </Pressable>
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
        <Text style={styles.label}>{t(isAvanzi ? 'itemForm.cookedDate.label' : 'itemForm.purchaseDate.label')}</Text>
        <DatePickerField value={purchaseDate} onChange={setPurchaseDate} allowClear={false} />
      </View>

      {!hidesExpiration ? (
        <View style={styles.field}>
          {replacesExpirationWithConsumeWithin ? (
            <ConsumeWithinFields
              colors={colors}
              t={t}
              styles={styles}
              label={t('itemForm.consumeWithin.label')}
              amount={consumeWithinAmount}
              onChangeAmount={(text) => handleConsumeWithinAmountChange(text)}
              unit={effectiveConsumeWithinUnit}
              onSelectUnit={selectConsumeWithinUnit}
              hint={t('itemForm.consumeWithin.hintReplace')}
              guideOnPress={
                showsConsumeWithinGuide
                  ? () => showAlert(t('itemForm.consumeWithinDays.guideTitle'), t(`itemForm.consumeWithinDays.guide.${category}`))
                  : undefined
              }
              voice={voice.available ? { active: voice.target === 'expiration', onPress: () => voice.start('expiration') } : undefined}
            />
          ) : (
            <>
              {showsExpiryModeToggle ? (
                <View style={styles.expiryModeRow}>
                  <Pressable
                    onPress={() => setExpiryMode('date')}
                    style={[styles.expiryModeChip, expiryMode === 'date' && styles.expiryModeChipActive]}
                  >
                    <Text style={[styles.expiryModeChipText, expiryMode === 'date' && { color: colors.white }]}>
                      {t('itemForm.expiryMode.date')}
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setExpiryMode('consumeWithin')}
                    style={[styles.expiryModeChip, expiryMode === 'consumeWithin' && styles.expiryModeChipActive]}
                  >
                    <Text style={[styles.expiryModeChipText, expiryMode === 'consumeWithin' && { color: colors.white }]}>
                      {t('itemForm.expiryMode.consumeWithin')}
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {expiryMode === 'date' ? (
                <>
                  {voice.available ? (
                    <View style={[styles.voiceLabelRow, styles.voiceLabelRowEnd]}>
                      <Pressable onPress={() => voice.start('expiration')} hitSlop={8}>
                        <Ionicons
                          name={voice.target === 'expiration' ? 'mic' : 'mic-outline'}
                          size={16}
                          color={voice.target === 'expiration' ? colors.danger : colors.brand}
                        />
                      </Pressable>
                    </View>
                  ) : null}
                  <DatePickerField value={expirationDate} onChange={setExpirationDate} />
                </>
              ) : (
                <ConsumeWithinFields
                  colors={colors}
                  t={t}
                  styles={styles}
                  label={t('itemForm.consumeWithin.label')}
                  amount={consumeWithinAmount}
                  onChangeAmount={(text) => handleConsumeWithinAmountChange(text)}
                  unit={effectiveConsumeWithinUnit}
                  onSelectUnit={selectConsumeWithinUnit}
                  hint={t('itemForm.consumeWithin.hintAdd')}
                  guideOnPress={
                    showsConsumeWithinGuide
                      ? () => showAlert(t('itemForm.consumeWithinDays.guideTitle'), t(`itemForm.consumeWithinDays.guide.${category}`))
                      : undefined
                  }
                  voice={voice.available ? { active: voice.target === 'expiration', onPress: () => voice.start('expiration') } : undefined}
                />
              )}
            </>
          )}
        </View>
      ) : null}

      {!hidesOpenedToggle ? (
        <View style={styles.field}>
          <Pressable onPress={handleToggleOpened} style={styles.openedToggle}>
            <Ionicons name={opened ? 'checkbox' : 'square-outline'} size={18} color={colors.brand} />
            <Text style={styles.openedToggleText}>{t('itemForm.openedToggle')}</Text>
          </Pressable>
          {opened ? (
            <>
              <Text style={styles.label}>{t('itemForm.openedDate.label')}</Text>
              <DatePickerField value={openedDate} onChange={setOpenedDate} allowClear={false} />
              <ConsumeWithinFields
                colors={colors}
                t={t}
                styles={styles}
                label={t('itemForm.openedReminder.label')}
                amount={openedConsumeWithinAmount}
                onChangeAmount={setOpenedConsumeWithinAmount}
                unit={openedConsumeWithinUnit}
                onSelectUnit={setOpenedConsumeWithinUnit}
                hint={t('itemForm.openedReminder.hint')}
              />
            </>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        {onDelete ? (
          <PrimaryButton label={t('common.delete')} variant="danger" onPress={onDelete} loading={deleting} style={{ flex: 0 }} />
        ) : null}
        <PrimaryButton label={submitLabel} onPress={handleSubmit} disabled={!canSubmit} loading={submitting} style={{ flex: 1 }} />
      </View>
      </ScrollView>

      <Modal visible={categoryModalVisible} transparent animationType="fade" onRequestClose={() => setCategoryModalVisible(false)}>
        <Pressable style={styles.pickerBackdrop} onPress={() => setCategoryModalVisible(false)}>
          <Pressable style={styles.pickerCard} onPress={() => {}}>
            <Text style={styles.pickerCardTitle}>{t('itemForm.category.label')}</Text>
            <ScrollView>
              <View style={styles.categoryGrid}>
                {categories.map((cat) => {
                  const active = category === cat.key;
                  return (
                    <Pressable
                      key={cat.key}
                      onPress={() => {
                        setCategory(cat.key);
                        setCategoryModalVisible(false);
                      }}
                      style={[styles.categoryChip, active && styles.categoryChipActive]}
                    >
                      <Text style={{ fontSize: 18 }}>{cat.emoji}</Text>
                      <Text style={styles.categoryChipText}>{cat.short}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
            <Pressable onPress={() => setCategoryModalVisible(false)} hitSlop={8}>
              <Text style={styles.pickerCardClose}>{t('common.close')}</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {enableScan ? (
        <Modal visible={scanModalVisible} transparent animationType="fade" onRequestClose={closeScanModal}>
          <View style={styles.scanBackdrop}>
            <View style={styles.scanCard}>
              <Text style={styles.scanTitle}>{t('scanProduct.title')}</Text>
              <Text style={styles.scanHint}>{t('scanProduct.hint')}</Text>

              <View style={styles.scanPhotosRow}>
                {scanPhotos.map((uri) => (
                  <View key={uri} style={styles.scanPhotoSlot}>
                    <Image source={{ uri }} style={styles.scanPhoto} resizeMode="cover" />
                    <Pressable onPress={() => removeScanPhoto(uri)} style={styles.scanPhotoRemove} hitSlop={8}>
                      <Ionicons name="close" size={14} color={colors.white} />
                    </Pressable>
                  </View>
                ))}
                {scanPhotos.length < MAX_SCAN_PHOTOS ? (
                  <Pressable
                    style={[styles.scanPhotoSlot, styles.scanPhotoAdd]}
                    onPress={() => addScanPhoto('camera')}
                  >
                    <Ionicons name="camera-outline" size={22} color={colors.brand} />
                  </Pressable>
                ) : null}
              </View>

              <Pressable onPress={() => addScanPhoto('gallery')}>
                <Text style={styles.scanGalleryLink}>{t('scanProduct.pickFromGallery')}</Text>
              </Pressable>

              <PrimaryButton
                label={t('scanProduct.analyze')}
                onPress={runScan}
                disabled={scanPhotos.length === 0}
                loading={scanRecognizing}
              />
              <Pressable onPress={closeScanModal} hitSlop={8}>
                <Text style={styles.scanCancel}>{t('common.cancel')}</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
    </KeyboardAvoidingView>
  );
});

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
    trigger: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    triggerText: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.ink },
    pickerBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    pickerCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, gap: 4, width: '100%', maxWidth: 360, maxHeight: '80%' },
    pickerCardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.ink, marginBottom: 8 },
    pickerCardClose: { textAlign: 'center', fontSize: 13, fontWeight: '600', color: COLORS.inkSoft, marginTop: 12 },
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
    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
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
    consumeWithinRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
    consumeWithinUnitGroup: { flexDirection: 'row', gap: 6 },
    consumeWithinUnitChip: {
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: COLORS.card,
    },
    consumeWithinUnitChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
    consumeWithinUnitChipText: { fontSize: 12, fontWeight: '600', color: COLORS.ink },
    voiceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    voiceLabelRowEnd: { justifyContent: 'flex-end' },
    expiryModeRow: { flexDirection: 'row', gap: 8 },
    expiryModeChip: {
      flex: 1,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card,
      borderRadius: 10,
      paddingVertical: 8,
    },
    expiryModeChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
    expiryModeChipText: { fontSize: 12, fontWeight: '600', color: COLORS.ink },
    openedToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    openedToggleText: { fontSize: 13, color: COLORS.ink },
    actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
    scanBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    scanCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, gap: 14, width: '100%', maxWidth: 360 },
    scanTitle: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
    scanHint: { fontSize: 13, color: COLORS.inkSoft, lineHeight: 18 },
    scanPhotosRow: { flexDirection: 'row', gap: 10 },
    scanPhotoSlot: {
      width: 90,
      height: 90,
      borderRadius: 12,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: COLORS.line,
    },
    scanPhoto: { width: '100%', height: '100%' },
    scanPhotoRemove: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: 'rgba(0,0,0,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    scanPhotoAdd: {
      alignItems: 'center',
      justifyContent: 'center',
      borderStyle: 'dashed',
      borderColor: COLORS.brand,
      backgroundColor: COLORS.bg,
    },
    scanGalleryLink: { fontSize: 12, fontWeight: '700', color: COLORS.brand },
    scanCancel: { textAlign: 'center', fontSize: 13, color: COLORS.inkSoft, marginTop: 4 },
  });
}

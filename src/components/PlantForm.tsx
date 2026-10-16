import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import React, { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getErrorMessage } from '../api/client';
import { plantsApi } from '../api/plants';
import { useModalBackHandler } from '../hooks/useModalBackHandler';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { webCentered } from '../theme/responsive';
import type { PlantInput } from '../types';
import { resizeForRecognition } from '../utils/imageResize';
import { showAlert } from './AppAlert';
import { DatePickerField } from './DatePickerField';
import { PrimaryButton } from './PrimaryButton';
import { TextField } from './TextField';

type FrequencyUnit = 'giorni' | 'settimane';
const DAYS_PER_WEEK = 7;

interface Props {
  initial?: Partial<PlantInput>;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (input: PlantInput) => void;
  onDelete?: () => void;
  deleting?: boolean;
  enableScan?: boolean;
}

export interface PlantFormHandle {
  openScan: () => void;
}

// Un valore di giorni si mostra in settimane solo se e' un multiplo esatto
// di 7: altrimenti mostrarlo diviso per 7 arrotonderebbe in modo fuorviante.
function frequencyDaysToDisplay(days: number): { amount: string; unit: FrequencyUnit } {
  if (days > 0 && days % DAYS_PER_WEEK === 0) {
    return { amount: String(days / DAYS_PER_WEEK), unit: 'settimane' };
  }
  return { amount: String(days), unit: 'giorni' };
}

export const PlantForm = forwardRef<PlantFormHandle, Props>(function PlantForm(
  { initial, submitLabel, submitting, onSubmit, onDelete, deleting, enableScan },
  ref
) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState(initial?.name ?? '');
  const [location, setLocation] = useState(initial?.location ?? '');
  const initialFrequency = initial?.wateringFrequencyDays ? frequencyDaysToDisplay(initial.wateringFrequencyDays) : null;
  const [frequencyAmount, setFrequencyAmount] = useState(initialFrequency?.amount ?? '');
  const [frequencyUnit, setFrequencyUnit] = useState<FrequencyUnit>(initialFrequency?.unit ?? 'giorni');
  const [careTip, setCareTip] = useState(initial?.careTip ?? '');
  const [lastWateredDate, setLastWateredDate] = useState<string | null>(initial?.lastWateredDate ?? null);

  const parsedFrequency = frequencyAmount.trim() ? Number(frequencyAmount.trim().replace(',', '.')) : null;
  const frequencyValid = parsedFrequency === null || (Number.isFinite(parsedFrequency) && parsedFrequency > 0);

  const [scanModalVisible, setScanModalVisible] = useState(false);
  useImperativeHandle(ref, () => ({ openScan: () => setScanModalVisible(true) }), []);
  const [scanPhoto, setScanPhoto] = useState<string | null>(null);
  const [scanRecognizing, setScanRecognizing] = useState(false);
  // Incrementato ogni volta che la scansione corrente va considerata
  // invalidata (annullata, o una nuova scansione avviata): un risultato di
  // Claude che arriva dopo non deve piu' toccare il form, stesso motivo
  // gia' in ItemForm.
  const scanRequestIdRef = useRef(0);

  function closeScanModal() {
    scanRequestIdRef.current += 1;
    setScanModalVisible(false);
    setScanPhoto(null);
  }

  useModalBackHandler(scanModalVisible, closeScanModal);

  async function pickScanPhoto(source: 'camera' | 'gallery') {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        showAlert(t('common.error'), t('scanPlant.cameraPermissionDenied'));
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.7 });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setScanPhoto(await resizeForRecognition(asset.uri, asset.width, asset.height));
      }
    } else {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showAlert(t('common.error'), t('scanPlant.libraryPermissionDenied'));
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7 });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setScanPhoto(await resizeForRecognition(asset.uri, asset.width, asset.height));
      }
    }
  }

  async function runScan() {
    if (!scanPhoto) return;
    const requestId = ++scanRequestIdRef.current;
    setScanRecognizing(true);
    try {
      const result = await plantsApi.scan(scanPhoto);
      // La scansione e' stata annullata (o superata da una piu' recente)
      // mentre il riconoscimento era in corso: il risultato e' ormai
      // stantio, non deve toccare cio' che l'utente ha fatto nel frattempo.
      if (scanRequestIdRef.current !== requestId) return;

      if (!result.name && !result.wateringFrequencyDays && !result.careTip) {
        showAlert(t('common.error'), t('scanPlant.noDataFound'));
        return;
      }

      if (result.name) setName(result.name);
      if (result.wateringFrequencyDays) {
        const display = frequencyDaysToDisplay(result.wateringFrequencyDays);
        setFrequencyAmount(display.amount);
        setFrequencyUnit(display.unit);
      }
      if (result.careTip) setCareTip(result.careTip);
      closeScanModal();
      showAlert(t('scanPlant.resultTitle'), t('scanPlant.resultMessage'));
    } catch (e) {
      if (scanRequestIdRef.current !== requestId) return;
      showAlert(t('common.error'), getErrorMessage(e, t));
    } finally {
      if (scanRequestIdRef.current === requestId) setScanRecognizing(false);
    }
  }

  function handleSubmit() {
    if (!name.trim() || !frequencyValid) return;
    const amount = parsedFrequency !== null ? Math.max(1, Math.round(parsedFrequency)) : null;
    onSubmit({
      name: name.trim(),
      location: location.trim() || null,
      wateringFrequencyDays: amount ? amount * (frequencyUnit === 'settimane' ? DAYS_PER_WEEK : 1) : null,
      careTip: careTip.trim() || null,
      lastWateredDate,
    });
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.container, webCentered, { paddingBottom: 40 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          label={t('plants.nameLabel')}
          placeholder={t('plants.namePlaceholder')}
          value={name}
          onChangeText={setName}
          autoFocus
        />

        <TextField
          label={t('plants.locationLabel')}
          placeholder={t('plants.locationPlaceholder')}
          value={location}
          onChangeText={setLocation}
        />

        <View style={styles.frequencyRow}>
          <View style={{ flex: 1 }}>
            <TextField
              label={t('plants.frequencyLabel')}
              placeholder={t('plants.frequencyPlaceholder')}
              keyboardType="numeric"
              value={frequencyAmount}
              onChangeText={setFrequencyAmount}
            />
          </View>
          <View style={styles.frequencyUnitGroup}>
            <Pressable
              onPress={() => setFrequencyUnit('giorni')}
              style={[styles.frequencyUnitChip, frequencyUnit === 'giorni' && styles.frequencyUnitChipActive]}
            >
              <Text style={[styles.frequencyUnitChipText, frequencyUnit === 'giorni' && { color: colors.white }]}>
                {t('itemForm.consumeWithin.unitDays')}
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFrequencyUnit('settimane')}
              style={[styles.frequencyUnitChip, frequencyUnit === 'settimane' && styles.frequencyUnitChipActive]}
            >
              <Text style={[styles.frequencyUnitChipText, frequencyUnit === 'settimane' && { color: colors.white }]}>
                {t('plants.unitWeeks')}
              </Text>
            </Pressable>
          </View>
        </View>

        <TextField
          label={t('plants.careTipLabel')}
          placeholder={t('plants.careTipPlaceholder')}
          value={careTip}
          onChangeText={setCareTip}
          multiline
          style={styles.careTipInput}
        />

        <View style={styles.field}>
          <Text style={styles.label}>{t('plants.lastWateredLabel')}</Text>
          <DatePickerField
            value={lastWateredDate}
            onChange={setLastWateredDate}
            placeholder={t('plants.lastWateredPlaceholder')}
            clearLabel={t('plants.lastWateredClear')}
          />
        </View>

        <View style={styles.actions}>
          {onDelete ? (
            <PrimaryButton label={t('common.delete')} variant="danger" onPress={onDelete} loading={deleting} style={{ flex: 0 }} />
          ) : null}
          <PrimaryButton label={submitLabel} onPress={handleSubmit} disabled={!name.trim() || !frequencyValid} loading={submitting} style={{ flex: 1 }} />
        </View>
      </ScrollView>

      {enableScan ? (
        <Modal visible={scanModalVisible} transparent animationType="fade" onRequestClose={closeScanModal}>
          <View style={styles.scanBackdrop}>
            <View style={styles.scanCard}>
              <Text style={styles.scanTitle}>{t('scanPlant.title')}</Text>
              <Text style={styles.scanHint}>{t('scanPlant.hint')}</Text>

              <View style={styles.scanPhotosRow}>
                {scanPhoto ? (
                  <View style={styles.scanPhotoSlot}>
                    <Image source={{ uri: scanPhoto }} style={styles.scanPhoto} resizeMode="cover" />
                    <Pressable onPress={() => setScanPhoto(null)} style={styles.scanPhotoRemove} hitSlop={8}>
                      <Ionicons name="close" size={14} color={colors.white} />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    style={[styles.scanPhotoSlot, styles.scanPhotoAdd]}
                    onPress={() => pickScanPhoto('camera')}
                  >
                    <Ionicons name="camera-outline" size={22} color={colors.brand} />
                  </Pressable>
                )}
              </View>

              <Pressable onPress={() => pickScanPhoto('gallery')}>
                <Text style={styles.scanGalleryLink}>{t('scanPlant.pickFromGallery')}</Text>
              </Pressable>

              <PrimaryButton
                label={t('scanPlant.analyze')}
                onPress={runScan}
                disabled={!scanPhoto}
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
    container: { padding: 20, gap: 16 },
    field: { gap: 8 },
    label: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: COLORS.inkSoft,
    },
    frequencyRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
    frequencyUnitGroup: { flexDirection: 'row', gap: 6 },
    frequencyUnitChip: {
      borderWidth: 1,
      borderColor: COLORS.line,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: COLORS.card,
    },
    frequencyUnitChipActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
    frequencyUnitChipText: { fontSize: 12, fontWeight: '600', color: COLORS.ink },
    careTipInput: { minHeight: 70, textAlignVertical: 'top' },
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
    },
    scanGalleryLink: { fontSize: 12, fontWeight: '700', color: COLORS.brand },
    scanCancel: { textAlign: 'center', fontSize: 13, color: COLORS.inkSoft, marginTop: 4 },
  });
}

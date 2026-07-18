import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { itemsApi } from '../../src/api/items';
import { showAlert } from '../../src/components/AppAlert';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useSelectableCategories, useLocationColor } from '../../src/constants/domain';
import { useStorageLocations } from '../../src/hooks/useStorageLocations';
import { useI18n } from '../../src/i18n/I18nContext';
import type { ColorPalette } from '../../src/theme/colors';
import { useTheme } from '../../src/theme/ThemeContext';
import { todayLocalISODate } from '../../src/utils/expiry';
import { parseReceiptLines } from '../../src/utils/receiptParser';
import type { Category } from '../../src/types';

interface ReceiptLine {
  id: string;
  name: string;
  checked: boolean;
}

export default function ScanReceiptScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { locations } = useStorageLocations();
  const categories = useSelectableCategories();
  const getLocationColor = useLocationColor();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [lines, setLines] = useState<ReceiptLine[]>([]);
  const [storageLocationId, setStorageLocationId] = useState<string>('');
  const [category, setCategory] = useState<Category>('ALTRO');
  const [saving, setSaving] = useState(false);

  const effectiveLocationId = storageLocationId || locations[0]?.id || '';
  const checkedCount = lines.filter((l) => l.checked && l.name.trim()).length;

  async function processImage(uri: string) {
    setPhotoUri(uri);
    setRecognizing(true);
    setLines([]);
    try {
      const result = await TextRecognition.recognize(uri);
      const candidates = parseReceiptLines(result.text);
      setLines(candidates.map((name, i) => ({ id: `${i}-${name}`, name, checked: true })));
    } catch {
      showAlert(t('common.error'), t('scanReceipt.recognizeError'));
    } finally {
      setRecognizing(false);
    }
  }

  async function handleTakePhoto() {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      showAlert(t('common.error'), t('scanReceipt.cameraPermissionDenied'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: 'images', quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      processImage(result.assets[0].uri);
    }
  }

  async function handlePickFromGallery() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert(t('common.error'), t('scanReceipt.libraryPermissionDenied'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      processImage(result.assets[0].uri);
    }
  }

  function reset() {
    setPhotoUri(null);
    setLines([]);
  }

  function toggleLine(id: string) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, checked: !l.checked } : l)));
  }

  function updateLineName(id: string, name: string) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l)));
  }

  async function handleConfirm() {
    const toAdd = lines.filter((l) => l.checked && l.name.trim());
    if (toAdd.length === 0 || !effectiveLocationId) return;
    setSaving(true);
    try {
      for (const line of toAdd) {
        await itemsApi.create({
          name: line.name.trim(),
          storageLocationId: effectiveLocationId,
          category,
          quantity: 1,
          unit: 'PZ',
          expirationDate: null,
          purchaseDate: todayLocalISODate(),
        });
      }
      queryClient.invalidateQueries({ queryKey: ['items'] });
      showAlert(t('common.ok'), t('scanReceipt.addedCount', { n: toAdd.length }));
      router.back();
    } catch {
      showAlert(t('common.error'), t('common.genericError'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingBottom: 40 + insets.bottom }]}>
      {!photoUri ? (
        <>
          <Text style={styles.intro}>{t('scanReceipt.intro')}</Text>
          <PrimaryButton label={t('scanReceipt.takePhoto')} onPress={handleTakePhoto} />
          <PrimaryButton label={t('scanReceipt.pickFromGallery')} variant="secondary" onPress={handlePickFromGallery} />
        </>
      ) : (
        <>
          <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
          <Pressable onPress={reset}>
            <Text style={styles.retake}>{t('scanReceipt.retake')}</Text>
          </Pressable>

          {recognizing ? (
            <Text style={styles.recognizing}>{t('scanReceipt.recognizing')}</Text>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={styles.label}>{t('scanReceipt.locationLabel')}</Text>
                <View style={styles.grid}>
                  {locations.map((location) => {
                    const active = effectiveLocationId === location.id;
                    const { color } = getLocationColor(location.id);
                    return (
                      <Pressable
                        key={location.id}
                        onPress={() => setStorageLocationId(location.id)}
                        style={[styles.chip, { borderColor: active ? color : colors.line, backgroundColor: active ? color : colors.card }]}
                      >
                        <Text style={{ fontSize: 14 }}>{location.emoji}</Text>
                        <Text style={[styles.chipText, { color: active ? colors.white : colors.ink }]}>{location.name}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>{t('scanReceipt.categoryLabel')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                  {categories.map((cat) => {
                    const active = category === cat.key;
                    return (
                      <Pressable
                        key={cat.key}
                        onPress={() => setCategory(cat.key)}
                        style={[styles.categoryChip, active && styles.categoryChipActive]}
                      >
                        <Text style={{ fontSize: 16 }}>{cat.emoji}</Text>
                        <Text style={styles.categoryChipText}>{cat.short}</Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>{t('scanReceipt.itemsTitle')}</Text>
                {lines.length === 0 ? (
                  <Text style={styles.hint}>{t('scanReceipt.noItemsFound')}</Text>
                ) : (
                  <>
                    <Text style={styles.hint}>{t('scanReceipt.itemsHint')}</Text>
                    <View style={styles.lineList}>
                      {lines.map((line) => (
                        <View key={line.id} style={styles.lineRow}>
                          <Pressable
                            onPress={() => toggleLine(line.id)}
                            style={[styles.checkbox, line.checked && styles.checkboxChecked]}
                          >
                            {line.checked ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
                          </Pressable>
                          <TextInput
                            value={line.name}
                            onChangeText={(v) => updateLineName(line.id, v)}
                            style={styles.lineInput}
                            placeholderTextColor={colors.inkSoft}
                          />
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </View>

              {checkedCount > 0 ? (
                <PrimaryButton
                  label={t('scanReceipt.confirm', { n: checkedCount })}
                  onPress={handleConfirm}
                  loading={saving}
                  disabled={!effectiveLocationId}
                />
              ) : null}
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    container: { padding: 20, gap: 16 },
    intro: { fontSize: 14, color: COLORS.inkSoft, lineHeight: 20 },
    preview: { width: '100%', height: 220, borderRadius: 14, backgroundColor: COLORS.card },
    retake: { color: COLORS.brand, fontWeight: '700', fontSize: 13, textAlign: 'center' },
    recognizing: { fontSize: 13, color: COLORS.inkSoft, textAlign: 'center', paddingVertical: 20 },
    field: { gap: 8 },
    label: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: COLORS.inkSoft,
    },
    hint: { fontSize: 12, color: COLORS.inkSoft },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    chipText: { fontWeight: '600', fontSize: 13 },
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
    lineList: { gap: 8 },
    lineRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: COLORS.line,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: COLORS.card,
    },
    checkboxChecked: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
    lineInput: {
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
  });
}

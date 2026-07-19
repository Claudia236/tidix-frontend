import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { getErrorMessage } from '../../src/api/client';
import { itemsApi } from '../../src/api/items';
import { showAlert } from '../../src/components/AppAlert';
import { ItemForm } from '../../src/components/ItemForm';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { useI18n } from '../../src/i18n/I18nContext';
import type { ColorPalette } from '../../src/theme/colors';
import { useTheme } from '../../src/theme/ThemeContext';
import type { Category, ItemInput } from '../../src/types';
import { parseReceiptLines } from '../../src/utils/receiptParser';

interface ReceiptLine {
  id: string;
  name: string;
}

export default function ScanReceiptScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [recognizing, setRecognizing] = useState(false);
  const [lines, setLines] = useState<ReceiptLine[]>([]);
  const [hasRecognized, setHasRecognized] = useState(false);
  const [editingLine, setEditingLine] = useState<ReceiptLine | null>(null);
  const [lastCategory, setLastCategory] = useState<Category | undefined>(undefined);
  const [lastStorageLocationId, setLastStorageLocationId] = useState<string | undefined>(undefined);
  const [savingItem, setSavingItem] = useState(false);

  async function processImage(uri: string) {
    setPhotoUri(uri);
    setRecognizing(true);
    setLines([]);
    setHasRecognized(false);
    try {
      const result = await TextRecognition.recognize(uri);
      const candidates = parseReceiptLines(result.text);
      setLines(candidates.map((name, i) => ({ id: `${i}-${name}`, name })));
      setHasRecognized(true);
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
    setHasRecognized(false);
  }

  function updateLineName(id: string, name: string) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l)));
  }

  function dismissLine(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }

  async function handleSaveFromForm(input: ItemInput) {
    if (!editingLine) return;
    const lineId = editingLine.id;
    setSavingItem(true);
    try {
      const created = await itemsApi.create(input);
      queryClient.invalidateQueries({ queryKey: ['items'] });
      setLastCategory(created.category);
      setLastStorageLocationId(created.storageLocationId);
      setLines((prev) => prev.filter((l) => l.id !== lineId));
      setEditingLine(null);
    } catch (e) {
      showAlert(t('common.error'), getErrorMessage(e, t));
    } finally {
      setSavingItem(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
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
            ) : lines.length === 0 ? (
              <>
                <Text style={styles.hint}>{hasRecognized ? t('scanReceipt.allDone') : t('scanReceipt.noItemsFound')}</Text>
                {hasRecognized ? (
                  <PrimaryButton label={t('scanReceipt.backToOverview')} variant="secondary" onPress={() => router.back()} />
                ) : null}
              </>
            ) : (
              <View style={styles.field}>
                <Text style={styles.label}>{t('scanReceipt.itemsTitle')}</Text>
                <Text style={styles.hint}>{t('scanReceipt.itemsHint')}</Text>
                <View style={styles.lineList}>
                  {lines.map((line) => (
                    <View key={line.id} style={styles.lineRow}>
                      <Pressable onPress={() => dismissLine(line.id)} style={styles.lineIconButton} hitSlop={8}>
                        <Ionicons name="close" size={18} color={colors.inkSoft} />
                      </Pressable>
                      <TextInput
                        value={line.name}
                        onChangeText={(v) => updateLineName(line.id, v)}
                        style={styles.lineInput}
                        placeholderTextColor={colors.inkSoft}
                      />
                      <Pressable onPress={() => setEditingLine(line)} style={styles.lineIconButton} hitSlop={8}>
                        <Ionicons name="pencil-outline" size={18} color={colors.brand} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={editingLine !== null} animationType="slide" onRequestClose={() => setEditingLine(null)}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setEditingLine(null)} hitSlop={8}>
              <Ionicons name="arrow-back" size={22} color={colors.ink} />
            </Pressable>
            <Text style={styles.modalTitle}>{t('appLayout.newProduct')}</Text>
            <View style={{ width: 22 }} />
          </View>
          {editingLine ? (
            <ItemForm
              key={editingLine.id}
              initial={{ name: editingLine.name, category: lastCategory, storageLocationId: lastStorageLocationId }}
              submitLabel={t('common.save')}
              submitting={savingItem}
              onSubmit={handleSaveFromForm}
            />
          ) : null}
        </SafeAreaView>
      </Modal>
    </KeyboardAvoidingView>
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
    lineList: { gap: 8 },
    lineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    lineIconButton: { padding: 2 },
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
    modalSafeArea: { flex: 1, backgroundColor: COLORS.bg },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.line,
    },
    modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.ink },
  });
}

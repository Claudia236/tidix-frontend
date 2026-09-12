import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { getErrorMessage } from '../../src/api/client';
import { itemsApi } from '../../src/api/items';
import { shoppingNotesApi } from '../../src/api/shoppingNotes';
import { showAlert } from '../../src/components/AppAlert';
import { ItemForm } from '../../src/components/ItemForm';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { deleteAction, SwipeableRow } from '../../src/components/SwipeableRow';
import { useModalBackHandler } from '../../src/hooks/useModalBackHandler';
import { useI18n } from '../../src/i18n/I18nContext';
import type { ColorPalette } from '../../src/theme/colors';
import { useTheme } from '../../src/theme/ThemeContext';
import type { Category, ItemInput } from '../../src/types';
import { resizeForRecognition } from '../../src/utils/imageResize';
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [savingSelected, setSavingSelected] = useState(false);
  // Ogni processImage() prende il proprio token: se nel frattempo parte una
  // nuova scansione (seconda foto scattata prima che la prima abbia finito
  // di riconoscere), il risultato della prima, quando arriva, non deve piu'
  // sovrascrivere le righe gia' mostrate per la foto corrente.
  const scanRequestIdRef = useRef(0);

  useModalBackHandler(editingLine !== null, () => setEditingLine(null));

  async function processImage(uri: string, width: number, height: number) {
    const requestId = ++scanRequestIdRef.current;
    setPhotoUri(uri);
    setRecognizing(true);
    setLines([]);
    setHasRecognized(false);
    try {
      // L'OCR gira su una copia ridimensionata (la foto a schermo resta
      // quella originale): una foto scattata dalla fotocamera e' molto piu'
      // grande di quanto serva per leggere il testo di uno scontrino, e
      // ridurla prima velocizza sensibilmente il riconoscimento.
      const recognitionUri = await resizeForRecognition(uri, width, height);
      if (scanRequestIdRef.current !== requestId) return;
      const result = await TextRecognition.recognize(recognitionUri);
      if (scanRequestIdRef.current !== requestId) return;
      const candidates = parseReceiptLines(result.text);
      const newLines = candidates.map((c, i) => ({ id: `${i}-${c.text}`, name: c.text }));
      setLines(newLines);
      // Solo le righe con un prezzo associato (il segnale piu' affidabile che
      // sia davvero un prodotto) partono pre-selezionate: le altre restano da
      // rivedere manualmente, cosi' si tocca meno per scontrini rumorosi
      // (es. una ricevuta di pagamento scansionata per errore).
      setSelectedIds(new Set(newLines.filter((_, i) => candidates[i].confident).map((l) => l.id)));
      setHasRecognized(true);
    } catch {
      if (scanRequestIdRef.current !== requestId) return;
      showAlert(t('common.error'), t('scanReceipt.recognizeError'));
    } finally {
      if (scanRequestIdRef.current === requestId) setRecognizing(false);
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
      const asset = result.assets[0];
      processImage(asset.uri, asset.width, asset.height);
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
      const asset = result.assets[0];
      processImage(asset.uri, asset.width, asset.height);
    }
  }

  function reset() {
    // Invalida anche una scansione OCR eventualmente ancora in corso: senza
    // incrementare il token qui, un risultato arrivato in ritardo dopo aver
    // premuto "Ritocca" ripopolava questa schermata (ormai senza foto) con
    // le righe di uno scontrino che l'utente aveva gia' scartato.
    scanRequestIdRef.current++;
    setPhotoUri(null);
    setRecognizing(false);
    setLines([]);
    setHasRecognized(false);
    setSelectedIds(new Set());
  }

  function updateLineName(id: string, name: string) {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l)));
  }

  function dismissLine(id: string) {
    setLines((prev) => prev.filter((l) => l.id !== id));
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function confirmDismissLine(line: ReceiptLine) {
    showAlert(t('scanReceipt.confirmDismissTitle'), t('scanReceipt.confirmDismissMessage', { name: line.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => dismissLine(line.id) },
    ]);
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === lines.length ? new Set() : new Set(lines.map((l) => l.id))));
  }

  // Le righe scelte diventano prodotti "Acquistati" (come quelli spuntati
  // dalla lista della spesa): restano li' pronte per essere aggiunte alle
  // scorte una alla volta, con calma, invece di dover per forza scegliere
  // subito zona/categoria/scadenza per ognuna qui.
  async function saveLinesAsPurchased(toSave: ReceiptLine[]) {
    // Le righe vengono create e spuntate in parallelo invece che una alla
    // volta: sono scritture indipendenti (il lock di famiglia lato backend le
    // serializza comunque per la scrittura vera e propria), ma in sequenza
    // ogni riga pagava un intero giro di rete a se', moltiplicando l'attesa
    // percepita per il numero di prodotti selezionati. Con Promise.allSettled
    // il giro di rete e' pagato una volta sola, e una riga fallita (rete/
    // timeout) non blocca ne' fa perdere il risultato delle altre.
    const savedIds = new Set<string>();
    const results = await Promise.allSettled(
      toSave.map(async (line) => {
        const note = await shoppingNotesApi.create({ text: line.name });
        await shoppingNotesApi.check(note.id);
        savedIds.add(line.id);
      })
    );
    if (savedIds.size > 0) {
      queryClient.invalidateQueries({ queryKey: ['shopping-notes'] });
      setLines((prev) => prev.filter((l) => !savedIds.has(l.id)));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        savedIds.forEach((id) => next.delete(id));
        return next;
      });
    }
    // Solo la prima riga fallita viene rilanciata (i chiamanti mostrano un
    // singolo alert di errore): le righe gia' rimosse da "lines" sopra non
    // verranno ricreate da un eventuale retry, quindi nessun duplicato.
    const firstFailure = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
    if (firstFailure) throw firstFailure.reason;
  }

  async function saveSelectedForLater() {
    const toSave = lines.filter((l) => selectedIds.has(l.id));
    if (toSave.length === 0) return;
    setSavingSelected(true);
    try {
      await saveLinesAsPurchased(toSave);
      showAlert(t('scanReceipt.saveSelectedSuccessTitle'), t('scanReceipt.saveSelectedSuccessMessage', { n: toSave.length }));
    } catch (e) {
      showAlert(t('common.error'), getErrorMessage(e, t));
    } finally {
      setSavingSelected(false);
    }
  }

  function confirmSaveSelectedForLater() {
    const n = lines.filter((l) => selectedIds.has(l.id)).length;
    if (n === 0) return;
    showAlert(t('scanReceipt.confirmSaveSelectedTitle'), t('scanReceipt.confirmSaveSelectedMessage', { n }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), onPress: saveSelectedForLater },
    ]);
  }

  function confirmSaveLineForLater(line: ReceiptLine) {
    showAlert(t('scanReceipt.confirmSaveOneTitle'), t('scanReceipt.confirmSaveOneMessage', { name: line.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.confirm'),
        onPress: async () => {
          try {
            await saveLinesAsPurchased([line]);
          } catch (e) {
            showAlert(t('common.error'), getErrorMessage(e, t));
          }
        },
      },
    ]);
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
      setSelectedIds((prev) => {
        if (!prev.has(lineId)) return prev;
        const next = new Set(prev);
        next.delete(lineId);
        return next;
      });
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

                <Pressable style={styles.selectAllRow} onPress={toggleSelectAll} hitSlop={6}>
                  <Ionicons
                    name={selectedIds.size === lines.length ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={selectedIds.size === lines.length ? colors.brand : colors.inkSoft}
                  />
                  <Text style={styles.selectAllText}>
                    {selectedIds.size === lines.length ? t('purchased.deselectAll') : t('purchased.selectAll')}
                  </Text>
                </Pressable>

                <View style={styles.lineList}>
                  {lines.map((line) => {
                    const selected = selectedIds.has(line.id);
                    return (
                      <SwipeableRow
                        key={line.id}
                        leftAction={{ onTrigger: () => confirmSaveLineForLater(line), icon: 'checkmark-done', color: colors.brand }}
                        rightAction={deleteAction(colors, () => confirmDismissLine(line))}
                      >
                        <View style={styles.lineRow}>
                          <Pressable onPress={() => toggleSelected(line.id)} style={styles.lineIconButton} hitSlop={8}>
                            <Ionicons
                              name={selected ? 'checkbox' : 'square-outline'}
                              size={20}
                              color={selected ? colors.brand : colors.inkSoft}
                            />
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
                          <Pressable onPress={() => confirmDismissLine(line)} style={styles.lineIconButton} hitSlop={8}>
                            <Ionicons name="close" size={18} color={colors.inkSoft} />
                          </Pressable>
                        </View>
                      </SwipeableRow>
                    );
                  })}
                </View>

                {selectedIds.size > 0 ? (
                  <PrimaryButton
                    label={t('scanReceipt.saveSelectedButton', { n: selectedIds.size })}
                    onPress={confirmSaveSelectedForLater}
                    loading={savingSelected}
                  />
                ) : null}
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
    selectAllRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    selectAllText: { fontSize: 13, fontWeight: '600', color: COLORS.inkSoft },
    lineList: { gap: 8 },
    lineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: COLORS.card,
      borderRadius: 10,
      padding: 6,
    },
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

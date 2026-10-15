import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useModalBackHandler } from '../hooks/useModalBackHandler';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { PrimaryButton } from './PrimaryButton';
import { TextField } from './TextField';

interface Props {
  visible: boolean;
  itemName: string;
  confirming?: boolean;
  onCancel: () => void;
  onConfirm: (detail: string) => void;
}

// Variante di AppAlert.showAlert con un campo di testo in piu': usata ovunque
// un'azione crei una nota nella lista della spesa (elimina+aggiungi, "Aggiungi
// a lista spesa"), per poter specificare subito "Quantita' / dettagli" invece
// di doverla aggiungere in un secondo momento aprendo la nota.
export function AddToShoppingListModal({ visible, itemName, confirming, onCancel, onConfirm }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [detail, setDetail] = useState('');

  useModalBackHandler(visible, onCancel);

  useEffect(() => {
    if (visible) setDetail('');
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <Pressable onPress={onCancel} hitSlop={8} style={styles.closeButton}>
            <Ionicons name="close" size={18} color={colors.inkSoft} />
          </Pressable>
          <Text style={styles.title}>{t('stock.confirmAddToShoppingListTitle')}</Text>
          <Text style={styles.message}>{t('stock.confirmAddToShoppingListMessage', { name: itemName })}</Text>

          <TextField
            label={t('shoppingNote.new.detailLabel')}
            placeholder={t('shoppingNote.new.detailPlaceholder')}
            value={detail}
            onChangeText={setDetail}
            autoFocus
          />

          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.cancelButton} hitSlop={8}>
              <Text style={styles.cancelText}>{t('common.cancel')}</Text>
            </Pressable>
            <PrimaryButton
              label={t('common.confirm')}
              onPress={() => onConfirm(detail.trim())}
              loading={confirming}
              style={styles.confirmButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, gap: 14, width: '100%', maxWidth: 360 },
    closeButton: { position: 'absolute', top: 12, right: 12, zIndex: 1 },
    title: { fontSize: 15, fontWeight: '700', color: COLORS.ink, paddingRight: 24 },
    message: { fontSize: 13, color: COLORS.inkSoft, lineHeight: 18 },
    actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 20, marginTop: 4 },
    cancelButton: { paddingVertical: 4 },
    cancelText: { fontSize: 14, fontWeight: '700', color: COLORS.inkSoft },
    confirmButton: { paddingHorizontal: 24 },
  });
}

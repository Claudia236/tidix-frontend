import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { PrimaryButton } from './PrimaryButton';
import { TextField } from './TextField';

interface Props {
  visible: boolean;
  initialDays: number;
  onConfirm: (days: number) => void;
  onCancel: () => void;
}

export function OpenedReminderDialog({ visible, initialDays, onConfirm, onCancel }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [days, setDays] = useState(String(initialDays));

  useEffect(() => {
    if (visible) setDays(String(initialDays));
  }, [visible, initialDays]);

  const parsed = Math.round(Number(days.replace(',', '.')));
  const valid = Number.isFinite(parsed) && parsed >= 1;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('itemForm.openedReminder.title')}</Text>
          <Text style={styles.message}>{t('itemForm.openedReminder.message')}</Text>
          <TextField
            label={t('itemForm.openedReminder.daysLabel')}
            placeholder="3"
            keyboardType="numeric"
            value={days}
            onChangeText={setDays}
            autoFocus
          />
          <View style={styles.actions}>
            <Pressable onPress={onCancel} style={styles.noButton}>
              <Text style={styles.noButtonText}>{t('common.no')}</Text>
            </Pressable>
            <PrimaryButton label={t('common.yes')} onPress={() => onConfirm(parsed)} disabled={!valid} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, gap: 14, width: '100%', maxWidth: 360 },
    title: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
    message: { fontSize: 13, color: COLORS.inkSoft, lineHeight: 18 },
    actions: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
    noButton: { paddingVertical: 11, paddingHorizontal: 4 },
    noButtonText: { fontSize: 14, fontWeight: '700', color: COLORS.inkSoft },
  });
}

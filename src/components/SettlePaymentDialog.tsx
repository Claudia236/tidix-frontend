import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { PrimaryButton } from './PrimaryButton';
import { TextField } from './TextField';

interface Props {
  visible: boolean;
  personName: string;
  totalOwed: number;
  submitting?: boolean;
  onConfirm: (amount: number) => void;
  onCancel: () => void;
}

export function SettlePaymentDialog({ visible, personName, totalOwed, submitting, onConfirm, onCancel }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (visible) setAmount(totalOwed > 0 ? totalOwed.toFixed(2) : '');
  }, [visible, totalOwed]);

  const parsed = Number(amount.replace(',', '.'));
  const valid = Number.isFinite(parsed) && parsed > 0;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('expenses.settleTitle', { name: personName })}</Text>
          <Text style={styles.subtitle}>{t('expenses.settleHint')}</Text>
          <TextField
            label={t('expenses.settleAmountLabel')}
            placeholder="0.00"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />
          <PrimaryButton
            label={t('expenses.settleConfirm')}
            onPress={() => onConfirm(parsed)}
            disabled={!valid}
            loading={submitting}
          />
          <Pressable onPress={onCancel} hitSlop={8}>
            <Text style={styles.cancel}>{t('common.cancel')}</Text>
          </Pressable>
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
    subtitle: { fontSize: 13, color: COLORS.inkSoft, lineHeight: 18 },
    cancel: { textAlign: 'center', fontSize: 13, color: COLORS.inkSoft, marginTop: 4 },
  });
}

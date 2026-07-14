import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { formatFullDate } from '../utils/expiry';
import { DatePickerField } from './DatePickerField';
import { PrimaryButton } from './PrimaryButton';

export interface RestockResult {
  mode: 'same' | 'new';
  expirationDate: string | null;
}

interface Props {
  visible: boolean;
  itemName: string;
  currentExpirationDate: string | null;
  submitting?: boolean;
  onConfirm: (result: RestockResult) => void;
  onCancel: () => void;
}

export function RestockDialog({ visible, itemName, currentExpirationDate, submitting, onConfirm, onCancel }: Props) {
  const { colors } = useTheme();
  const { t, language } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [choosingNewDate, setChoosingNewDate] = useState(false);
  const [newDate, setNewDate] = useState<string | null>(currentExpirationDate);

  useEffect(() => {
    if (visible) {
      setChoosingNewDate(false);
      setNewDate(currentExpirationDate);
    }
  }, [visible, currentExpirationDate]);

  function handleSame() {
    onConfirm({ mode: 'same', expirationDate: null });
  }

  function handleConfirmNewDate() {
    onConfirm({ mode: 'new', expirationDate: newDate });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{t('restock.title', { name: itemName })}</Text>

          {!choosingNewDate ? (
            <>
              <Text style={styles.subtitle}>
                {t('restock.sameDatePrefix')}
                {currentExpirationDate ? ` (${formatFullDate(currentExpirationDate, language)})` : t('restock.noExpirySet')}
                {t('restock.orChanged')}
              </Text>
              <View style={styles.actions}>
                <PrimaryButton label={t('restock.same')} onPress={handleSame} loading={submitting} style={{ flex: 1 }} />
                <PrimaryButton
                  label={t('restock.newDate')}
                  variant="secondary"
                  onPress={() => setChoosingNewDate(true)}
                  disabled={submitting}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.subtitle}>{t('restock.newBatchHint')}</Text>
              <DatePickerField value={newDate} onChange={setNewDate} />
              <PrimaryButton label={t('common.confirm')} onPress={handleConfirmNewDate} loading={submitting} />
            </>
          )}

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
    actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
    cancel: { textAlign: 'center', fontSize: 13, color: COLORS.inkSoft, marginTop: 4 },
  });
}

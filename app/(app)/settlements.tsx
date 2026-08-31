import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getErrorMessage } from '../../src/api/client';
import { settlementsApi } from '../../src/api/settlements';
import { showAlert } from '../../src/components/AppAlert';
import { DatePickerField } from '../../src/components/DatePickerField';
import { EmptyState } from '../../src/components/EmptyState';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { TextField } from '../../src/components/TextField';
import { useModalBackHandler } from '../../src/hooks/useModalBackHandler';
import { useI18n } from '../../src/i18n/I18nContext';
import type { ColorPalette } from '../../src/theme/colors';
import { useTheme } from '../../src/theme/ThemeContext';
import { webCentered } from '../../src/theme/responsive';
import type { Settlement } from '../../src/types';
import { formatDashDate, todayLocalISODate } from '../../src/utils/expiry';

export default function SettlementsScreen() {
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const [editTarget, setEditTarget] = useState<Settlement | null>(null);

  const settlementsQuery = useQuery({ queryKey: ['settlements'], queryFn: () => settlementsApi.list() });

  const updateMutation = useMutation({
    mutationFn: ({ id, amount, date }: { id: string; amount: number; date: string }) =>
      settlementsApi.update(id, amount, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setEditTarget(null);
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => settlementsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settlements'] });
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  function confirmDelete(id: string) {
    showAlert(t('settlements.confirmDeleteTitle'), t('settlements.confirmDeleteMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeMutation.mutate(id) },
    ]);
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={settlementsQuery.data ?? []}
        keyExtractor={(s) => s.id}
        contentContainerStyle={[styles.list, webCentered, { paddingBottom: 40 + insets.bottom }]}
        ListEmptyComponent={
          <EmptyState icon="cash-outline" title={t('settlements.emptyTitle')} subtitle={t('settlements.emptySubtitle')} />
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.topRow}>
              <View style={styles.topRowText}>
                <Text style={styles.name}>{t('settlements.paidBy', { name: item.debtorName })}</Text>
                <Text style={styles.date}>{formatDashDate(item.date)}</Text>
              </View>
              <Text style={styles.amount}>{item.amount.toFixed(2)} €</Text>
            </View>

            {item.allocations.length > 0 ? (
              <View style={styles.allocations}>
                <Text style={styles.allocationsLabel}>{t('settlements.allocatedTo')}</Text>
                {item.allocations.map((a, i) => (
                  <View key={`${a.expenseId}-${i}`} style={styles.allocationRow}>
                    <Text style={styles.allocationDescription} numberOfLines={1}>{a.expenseDescription}</Text>
                    <Text style={styles.allocationAmount}>{a.amountApplied.toFixed(2)} €</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {item.leftover > 0.01 ? (
              <Text style={styles.leftover}>{t('settlements.leftoverNote', { amount: item.leftover.toFixed(2) })}</Text>
            ) : null}

            <View style={styles.actions}>
              <Pressable style={styles.actionButton} onPress={() => setEditTarget(item)} hitSlop={8}>
                <Ionicons name="pencil-outline" size={16} color={colors.inkSoft} />
              </Pressable>
              <Pressable style={styles.actionButton} onPress={() => confirmDelete(item.id)} hitSlop={8}>
                <Ionicons name="trash-outline" size={16} color={colors.inkSoft} />
              </Pressable>
            </View>
          </View>
        )}
      />

      <EditSettlementDialog
        visible={editTarget !== null}
        settlement={editTarget}
        submitting={updateMutation.isPending}
        onCancel={() => setEditTarget(null)}
        onConfirm={(amount, date) => {
          if (!editTarget) return;
          updateMutation.mutate({ id: editTarget.id, amount, date });
        }}
      />
    </View>
  );
}

function EditSettlementDialog({
  visible,
  settlement,
  submitting,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  settlement: Settlement | null;
  submitting?: boolean;
  onConfirm: (amount: number, date: string) => void;
  onCancel: () => void;
}) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState<string | null>(null);

  useEffect(() => {
    if (visible && settlement) {
      setAmount(settlement.amount.toFixed(2));
      setDate(settlement.date);
    }
  }, [visible, settlement]);

  const parsed = Number(amount.replace(',', '.'));
  const valid = Number.isFinite(parsed) && parsed > 0;

  useModalBackHandler(visible, onCancel);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.dialogCard}>
          <Text style={styles.dialogTitle}>{t('settlements.editTitle')}</Text>
          <Text style={styles.dialogHint}>{t('settlements.editHint')}</Text>
          <TextField
            label={t('expenses.settleAmountLabel')}
            placeholder="0.00"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />
          <View style={styles.dialogField}>
            <Text style={styles.dialogFieldLabel}>{t('settlements.dateLabel')}</Text>
            <DatePickerField value={date} onChange={setDate} allowClear={false} />
          </View>
          <PrimaryButton
            label={t('common.saveChanges')}
            onPress={() => onConfirm(parsed, date ?? todayLocalISODate())}
            disabled={!valid}
            loading={submitting}
          />
          <Pressable onPress={onCancel} hitSlop={8}>
            <Text style={styles.dialogCancel}>{t('common.cancel')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg },
    list: { padding: 20, gap: 10 },
    card: {
      backgroundColor: COLORS.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.line,
      padding: 14,
      gap: 10,
    },
    topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
    topRowText: { flex: 1, gap: 2 },
    name: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
    date: { fontSize: 12, color: COLORS.inkSoft },
    amount: { fontSize: 15, fontWeight: '800', color: COLORS.ink },
    allocations: { gap: 4, borderTopWidth: 1, borderColor: COLORS.line, paddingTop: 10 },
    allocationsLabel: { fontSize: 11, fontWeight: '700', color: COLORS.inkSoft, textTransform: 'uppercase', letterSpacing: 0.4 },
    allocationRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    allocationDescription: { flex: 1, fontSize: 12, color: COLORS.ink },
    allocationAmount: { fontSize: 12, color: COLORS.inkSoft },
    leftover: { fontSize: 12, color: COLORS.gold, fontStyle: 'italic' },
    actions: { flexDirection: 'row', gap: 16, justifyContent: 'flex-end', borderTopWidth: 1, borderColor: COLORS.line, paddingTop: 8 },
    actionButton: { padding: 2 },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    dialogCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, gap: 14, width: '100%', maxWidth: 360 },
    dialogTitle: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
    dialogHint: { fontSize: 13, color: COLORS.inkSoft, lineHeight: 18 },
    dialogField: { gap: 8 },
    dialogFieldLabel: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: COLORS.inkSoft,
    },
    dialogCancel: { textAlign: 'center', fontSize: 13, color: COLORS.inkSoft, marginTop: 4 },
  });
}

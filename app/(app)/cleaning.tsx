import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cleaningApi } from '../../src/api/cleaning';
import { getErrorMessage } from '../../src/api/client';
import { showAlert } from '../../src/components/AppAlert';
import { DatePickerField } from '../../src/components/DatePickerField';
import { EmptyState } from '../../src/components/EmptyState';
import { PrimaryButton } from '../../src/components/PrimaryButton';
import { TextField } from '../../src/components/TextField';
import { useCleaningSuggestions, type CleaningSuggestion } from '../../src/constants/domain';
import { useI18n } from '../../src/i18n/I18nContext';
import { syncCleaningReminders } from '../../src/notifications/cleaningReminders';
import type { ColorPalette } from '../../src/theme/colors';
import { useTheme } from '../../src/theme/ThemeContext';
import { webCentered } from '../../src/theme/responsive';
import type { CleaningTask } from '../../src/types';

export default function CleaningScreen() {
  const queryClient = useQueryClient();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const cleaningSuggestions = useCleaningSuggestions();
  const tasksQuery = useQuery({ queryKey: ['cleaning-tasks'], queryFn: cleaningApi.list });

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [frequencyDays, setFrequencyDays] = useState('');
  const [lastCleanedDate, setLastCleanedDate] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' || !tasksQuery.data) return;
    syncCleaningReminders(tasksQuery.data, t);
  }, [tasksQuery.data, t]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const input = {
        name: name.trim(),
        frequencyDays: frequencyDays.trim() ? Math.max(1, Number(frequencyDays)) : null,
        lastCleanedDate,
      };
      return editingId ? cleaningApi.update(editingId, input) : cleaningApi.create(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cleaning-tasks'] });
      closeForm();
    },
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const markCleanedMutation = useMutation({
    mutationFn: (id: string) => cleaningApi.markCleaned(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cleaning-tasks'] }),
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => cleaningApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cleaning-tasks'] }),
    onError: (e) => showAlert(t('common.error'), getErrorMessage(e, t)),
  });

  function openAddForm() {
    setEditingId(null);
    setName('');
    setFrequencyDays('');
    setLastCleanedDate(null);
    setFormOpen(true);
  }

  function openEditForm(task: CleaningTask) {
    setEditingId(task.id);
    setName(task.name);
    setFrequencyDays(task.frequencyDays ? String(task.frequencyDays) : '');
    setLastCleanedDate(task.lastCleanedDate);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
  }

  function applySuggestion(suggestion: CleaningSuggestion) {
    setName(suggestion.name);
    setFrequencyDays(String(suggestion.frequencyDays));
  }

  function confirmDelete(task: CleaningTask) {
    showAlert(t('cleaning.confirmDeleteTitle'), t('cleaning.confirmDeleteMessage', { name: task.name }), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => removeMutation.mutate(task.id) },
    ]);
  }

  const tasks = tasksQuery.data ?? [];

  return (
    <View style={styles.container}>
      <View style={[styles.topSection, webCentered]}>
        <Pressable onPress={() => (formOpen ? closeForm() : openAddForm())} style={styles.addToggle}>
          <Ionicons name={formOpen ? 'remove-circle-outline' : 'add-circle-outline'} size={18} color={colors.brand} />
          <Text style={styles.addToggleText}>{formOpen ? t('common.cancel') : t('cleaning.addToggle')}</Text>
        </Pressable>

        {formOpen ? (
          <View style={styles.form}>
            <TextField
              label={t('cleaning.nameLabel')}
              placeholder={t('cleaning.namePlaceholder')}
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <View style={styles.field}>
              <Text style={styles.label}>{t('cleaning.suggestionsLabel')}</Text>
              <View style={styles.suggestionRow}>
                {cleaningSuggestions.map((s) => (
                  <Pressable key={s.name} onPress={() => applySuggestion(s)} style={styles.suggestionChip}>
                    <Text style={{ fontSize: 13 }}>{s.emoji}</Text>
                    <Text style={styles.suggestionChipText}>{s.name}</Text>
                    <Text style={styles.suggestionChipFreq}>{t('cleaning.everyDaysShort', { n: s.frequencyDays })}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <TextField
              label={t('cleaning.frequencyLabel')}
              placeholder={t('cleaning.frequencyPlaceholder')}
              keyboardType="numeric"
              value={frequencyDays}
              onChangeText={setFrequencyDays}
            />

            <View style={styles.field}>
              <Text style={styles.label}>{t('cleaning.lastCleanedLabel')}</Text>
              <DatePickerField
                value={lastCleanedDate}
                onChange={setLastCleanedDate}
                placeholder={t('cleaning.lastCleanedPlaceholder')}
                clearLabel={t('cleaning.lastCleanedClear')}
              />
            </View>

            <PrimaryButton
              label={editingId ? t('common.saveChanges') : t('common.add')}
              onPress={() => saveMutation.mutate()}
              disabled={!name.trim()}
              loading={saveMutation.isPending}
            />
          </View>
        ) : null}
      </View>

      <FlatList
        data={tasks}
        keyExtractor={(task) => task.id}
        contentContainerStyle={[styles.list, webCentered, { paddingBottom: 20 + insets.bottom }]}
        ListEmptyComponent={
          <EmptyState
            icon="sparkles-outline"
            title={t('cleaning.emptyTitle')}
            subtitle={t('cleaning.emptySubtitle')}
          />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, item.overdue && styles.cardOverdue]}>
            <Pressable style={styles.cardInfo} onPress={() => openEditForm(item)}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardStatus}>
                {item.daysSinceCleaned === null
                  ? t('cleaning.neverCleaned')
                  : item.daysSinceCleaned === 0
                    ? t('cleaning.cleanedToday')
                    : t('cleaning.cleanedDaysAgo', { n: item.daysSinceCleaned })}
                {item.frequencyDays ? t('cleaning.everyDaysSuffix', { n: item.frequencyDays }) : ''}
              </Text>
              {item.overdue ? <Text style={styles.overdueLabel}>{t('cleaning.overdue')}</Text> : null}
            </Pressable>
            <View style={styles.cardActions}>
              <Pressable onPress={() => markCleanedMutation.mutate(item.id)} style={styles.cleanButton} hitSlop={8}>
                <Ionicons name="checkmark" size={16} color={colors.white} />
              </Pressable>
              <Pressable onPress={() => openEditForm(item)} hitSlop={8}>
                <Ionicons name="pencil-outline" size={18} color={colors.inkSoft} />
              </Pressable>
              <Pressable onPress={() => confirmDelete(item)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color={colors.inkSoft} />
              </Pressable>
            </View>
          </View>
        )}
      />
    </View>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg, paddingTop: 16 },
    topSection: { paddingHorizontal: 20, gap: 12 },
    addToggle: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    addToggleText: { fontSize: 14, fontWeight: '700', color: COLORS.brand },
    form: {
      gap: 14,
      backgroundColor: COLORS.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.line,
      padding: 16,
    },
    field: { gap: 8 },
    label: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.4,
      color: COLORS.inkSoft,
    },
    suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    suggestionChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card,
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 6,
    },
    suggestionChipText: { fontSize: 12, fontWeight: '600', color: COLORS.ink },
    suggestionChipFreq: { fontSize: 10, color: COLORS.inkSoft },
    list: { padding: 20, paddingTop: 16, gap: 10 },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: COLORS.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.line,
      padding: 14,
    },
    cardOverdue: { borderColor: COLORS.danger },
    cardInfo: { flex: 1, gap: 2 },
    cardName: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
    cardStatus: { fontSize: 12, color: COLORS.inkSoft },
    overdueLabel: { fontSize: 11, fontWeight: '700', color: COLORS.danger, marginTop: 2 },
    cardActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    cleanButton: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: COLORS.brand,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}

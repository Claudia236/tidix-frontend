import React, { useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCategories } from '../constants/domain';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import type { Category } from '../types';

interface Props {
  visible: boolean;
  title?: string;
  onSelect: (category: Category) => void;
  onClose: () => void;
}

export function CategoryPickerModal({ visible, title, onSelect, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const categories = useCategories();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title ?? t('categoryPicker.defaultTitle')}</Text>
          <View style={styles.grid}>
            {categories.map((cat) => (
              <Pressable key={cat.key} onPress={() => onSelect(cat.key)} style={styles.chip}>
                <Text style={{ fontSize: 16 }}>{cat.emoji}</Text>
                <Text style={styles.chipText}>{cat.short}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
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
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 7,
    },
    chipText: { fontSize: 12, fontWeight: '600', color: COLORS.ink },
    cancel: { textAlign: 'center', fontSize: 13, color: COLORS.inkSoft, marginTop: 4 },
  });
}

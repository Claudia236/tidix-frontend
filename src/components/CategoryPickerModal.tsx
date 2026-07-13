import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { CATEGORIES } from '../constants/domain';
import { COLORS } from '../theme/colors';
import type { Category } from '../types';

interface Props {
  visible: boolean;
  title?: string;
  onSelect: (category: Category) => void;
  onClose: () => void;
}

export function CategoryPickerModal({ visible, title = 'Scegli una categoria', onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.grid}>
            {CATEGORIES.map((cat) => (
              <Pressable key={cat.key} onPress={() => onSelect(cat.key)} style={styles.chip}>
                <Text style={{ fontSize: 16 }}>{cat.emoji}</Text>
                <Text style={styles.chipText}>{cat.short}</Text>
              </Pressable>
            ))}
          </View>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={styles.cancel}>Annulla</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, gap: 14, width: '100%', maxWidth: 360 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: COLORS.line,
    backgroundColor: COLORS.white,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: COLORS.ink },
  cancel: { textAlign: 'center', fontSize: 13, color: COLORS.inkSoft, marginTop: 4 },
});

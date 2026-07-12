import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors';

export function AddFab() {
  const router = useRouter();
  return (
    <Pressable style={styles.fab} onPress={() => router.push('/(app)/item/new')}>
      <Ionicons name="add" size={22} color={COLORS.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 88,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
});

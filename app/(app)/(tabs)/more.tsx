import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SectionTitle } from '../../../src/components/SectionTitle';
import { COLORS } from '../../../src/theme/colors';
import { webCentered } from '../../../src/theme/responsive';

const ENTRIES: { icon: keyof typeof Ionicons.glyphMap; label: string; subtitle: string; path: string }[] = [
  { icon: 'sparkles-outline', label: 'Pulizia', subtitle: 'Ambienti ed elettrodomestici', path: '/(app)/cleaning' },
  { icon: 'trash-outline', label: 'Rifiuti', subtitle: 'Raccolta differenziata giornaliera', path: '/(app)/waste' },
  { icon: 'cash-outline', label: 'Spese', subtitle: 'Chi ha pagato cosa, riepilogo mensile', path: '/(app)/expenses' },
  { icon: 'people-outline', label: 'Famiglia', subtitle: 'Membri e codice invito', path: '/(app)/household' },
];

export default function MoreScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <SectionTitle>Altro</SectionTitle>

        <View style={styles.list}>
          {ENTRIES.map((entry) => (
            <Pressable key={entry.path} style={styles.row} onPress={() => router.push(entry.path as never)}>
              <View style={styles.iconWrap}>
                <Ionicons name={entry.icon} size={20} color={COLORS.brand} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>{entry.label}</Text>
                <Text style={styles.rowSubtitle}>{entry.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.inkSoft} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 20, gap: 16, paddingBottom: 120, ...webCentered },
  list: { gap: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.line,
    padding: 14,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.okBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
  rowSubtitle: { fontSize: 12, color: COLORS.inkSoft, marginTop: 2 },
});

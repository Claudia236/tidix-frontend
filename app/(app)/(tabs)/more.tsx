import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SectionTitle } from '../../../src/components/SectionTitle';
import { useI18n } from '../../../src/i18n/I18nContext';
import type { ColorPalette } from '../../../src/theme/colors';
import { useTheme } from '../../../src/theme/ThemeContext';
import { webCentered } from '../../../src/theme/responsive';

export default function MoreScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const entries: { icon: keyof typeof Ionicons.glyphMap; label: string; subtitle: string; path: string }[] = [
    { icon: 'sparkles-outline', label: t('more.cleaning.label'), subtitle: t('more.cleaning.subtitle'), path: '/(app)/cleaning' },
    { icon: 'trash-outline', label: t('more.waste.label'), subtitle: t('more.waste.subtitle'), path: '/(app)/waste' },
    { icon: 'cash-outline', label: t('more.expenses.label'), subtitle: t('more.expenses.subtitle'), path: '/(app)/expenses' },
    { icon: 'bag-check-outline', label: t('more.purchased.label'), subtitle: t('more.purchased.subtitle'), path: '/(app)/shopping-purchased' },
    { icon: 'people-outline', label: t('more.household.label'), subtitle: t('more.household.subtitle'), path: '/(app)/household' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <SectionTitle logo>{t('more.title')}</SectionTitle>

        <View style={styles.list}>
          {entries.map((entry) => (
            <Pressable key={entry.path} style={styles.row} onPress={() => router.push(entry.path as never)}>
              <View style={styles.iconWrap}>
                <Ionicons name={entry.icon} size={20} color={colors.brand} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowLabel}>{entry.label}</Text>
                <Text style={styles.rowSubtitle}>{entry.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.inkSoft} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.bg },
    container: { padding: 20, gap: 16, paddingBottom: 120, ...webCentered },
    list: { gap: 10 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: COLORS.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: COLORS.line,
      padding: 14,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: COLORS.brandBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowInfo: { flex: 1 },
    rowLabel: { fontSize: 14, fontWeight: '700', color: COLORS.ink },
    rowSubtitle: { fontSize: 12, color: COLORS.inkSoft, marginTop: 2 },
  });
}

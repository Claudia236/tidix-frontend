import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getErrorMessage } from '../api/client';
import { recipesApi } from '../api/recipes';
import { useModalBackHandler } from '../hooks/useModalBackHandler';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { webCentered } from '../theme/responsive';
import type { RecipeSuggestion } from '../types';
import { showAlert } from './AppAlert';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  visible: boolean;
  onClose: () => void;
  // Firma dell'insieme di prodotti in scadenza/aperti al momento
  // dell'apertura (vedi recipeIngredientsKey in index.tsx): fa parte della
  // chiave della query, cosi' una nuova chiamata parte da sola solo quando
  // gli ingredienti disponibili cambiano davvero, non ad ogni apertura.
  ingredientsKey: string;
}

export function RecipeSuggestionsModal({ visible, onClose, ingredientsKey }: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);

  useModalBackHandler(visible, onClose);

  const recipesQuery = useQuery({
    queryKey: ['recipes', 'suggest', ingredientsKey],
    queryFn: recipesApi.suggest,
    enabled: visible && ingredientsKey.length > 0,
    // Nessun refetch automatico per tempo/focus: deve ripartire da sola solo
    // quando la queryKey cambia (ingredienti diversi) o su refetch esplicito
    // (pulsante "Altre idee"), mai perche' sono passati 30s o la finestra ha
    // ripreso il focus.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const recipes = recipesQuery.data ?? [];

  async function handleRegenerate() {
    const result = await recipesQuery.refetch();
    // Un refetch fallito con ricette gia' in cache non svuota "data" (resta
    // l'ultimo risultato valido): senza questo avviso esplicito, l'errore
    // passerebbe inosservato e l'utente penserebbe che "Altre idee" non
    // abbia fatto nulla.
    if (result.isError) {
      showAlert(t('common.error'), getErrorMessage(result.error, t));
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.body, webCentered]}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t('recipeModal.title')}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {recipesQuery.isLoading ? (
              <View style={styles.centerState}>
                <ActivityIndicator color={colors.brand} />
                <Text style={styles.centerStateText}>{t('recipeModal.loading')}</Text>
              </View>
            ) : recipes.length === 0 && recipesQuery.isError ? (
              <View style={styles.centerState}>
                <Ionicons name="alert-circle-outline" size={32} color={colors.inkSoft} />
                <Text style={styles.centerStateText}>{getErrorMessage(recipesQuery.error, t)}</Text>
              </View>
            ) : recipes.length === 0 ? (
              <View style={styles.centerState}>
                <Text style={styles.centerStateText}>{t('recipeModal.empty')}</Text>
              </View>
            ) : (
              <View style={styles.recipeList}>
                {recipes.map((recipe, index) => (
                  <RecipeCard key={`${recipe.title}-${index}`} recipe={recipe} styles={styles} colors={colors} />
                ))}
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <PrimaryButton
              label={t('recipeModal.regenerate')}
              onPress={handleRegenerate}
              loading={recipesQuery.isFetching}
              variant="secondary"
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function RecipeCard({
  recipe,
  styles,
  colors,
}: {
  recipe: RecipeSuggestion;
  styles: ReturnType<typeof createStyles>;
  colors: ColorPalette;
}) {
  const { t } = useI18n();
  return (
    <View style={styles.recipeCard}>
      <Text style={styles.recipeTitle}>{recipe.title}</Text>

      {recipe.usesItems.length > 0 ? (
        <View style={styles.tagRow}>
          {recipe.usesItems.map((item) => (
            <View key={item} style={styles.tag}>
              <Text style={styles.tagText}>{item}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {recipe.extraIngredients.length > 0 ? (
        <Text style={styles.extraIngredientsText}>
          {t('recipeModal.extraIngredients')}: {recipe.extraIngredients.join(', ')}
        </Text>
      ) : null}

      <View style={styles.stepsList}>
        {recipe.steps.map((step, i) => (
          <View key={i} style={styles.stepRow}>
            <Text style={[styles.stepNumber, { color: colors.brand }]}>{i + 1}</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: COLORS.bg },
    body: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.line,
    },
    headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.ink },
    scrollContent: { padding: 20, gap: 14, flexGrow: 1 },
    centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 60 },
    centerStateText: { fontSize: 13, color: COLORS.inkSoft, textAlign: 'center' },
    recipeList: { gap: 14 },
    recipeCard: {
      backgroundColor: COLORS.card,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: COLORS.line,
      padding: 16,
      gap: 10,
    },
    recipeTitle: { fontSize: 16, fontWeight: '800', color: COLORS.ink },
    tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    tag: { backgroundColor: COLORS.brandBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    tagText: { fontSize: 12, fontWeight: '600', color: COLORS.brand },
    extraIngredientsText: { fontSize: 12, color: COLORS.inkSoft },
    stepsList: { gap: 6 },
    stepRow: { flexDirection: 'row', gap: 8 },
    stepNumber: { fontSize: 13, fontWeight: '800', width: 16 },
    stepText: { flex: 1, fontSize: 13, color: COLORS.ink, lineHeight: 19 },
    footer: { paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1, borderTopColor: COLORS.line },
  });
}

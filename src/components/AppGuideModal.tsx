import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useModalBackHandler } from '../hooks/useModalBackHandler';
import { useI18n } from '../i18n/I18nContext';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { WEB_MAX_WIDTH, webCentered } from '../theme/responsive';
import { PrimaryButton } from './PrimaryButton';

type GuideIcon = keyof typeof Ionicons.glyphMap;

interface GuideSlideDef {
  key: string;
  icon: GuideIcon;
  badgeIcon: GuideIcon;
  titleKey: string;
  bodyKey: string;
  // Screenshot reale della schermata, quando disponibile: una coppia per
  // tema (chiaro/scuro), scelta in base al tema corrente dell'app. Finche'
  // non e' disponibile per una slide si mostra l'icona+badge come fallback.
  imageLight?: ImageSourcePropType;
  imageDark?: ImageSourcePropType;
}

// Ogni slide ha un'icona principale piu' una piccola "badge" in basso a
// destra, cosi' da comporre un'illustrazione un po' piu' ricca di una sola
// icona senza dover disegnare grafiche custom: stessa libreria di icone usata
// in tutto il resto dell'app (vedi tabs/_layout.tsx per le stesse icone
// principali di Panoramica/Scorte/Lista spesa), quindi coerente a colpo d'occhio.
const GUIDE_SLIDES: GuideSlideDef[] = [
  {
    key: 'overview',
    icon: 'grid-outline',
    badgeIcon: 'alert-circle-outline',
    titleKey: 'household.guide.overview.title',
    bodyKey: 'household.guide.overview.body',
    imageLight: require('../../assets/guide/overview-light.jpg'),
    imageDark: require('../../assets/guide/overview-dark.jpg'),
  },
  {
    key: 'quickAdd',
    icon: 'add-circle-outline',
    badgeIcon: 'flash-outline',
    titleKey: 'household.guide.quickAdd.title',
    bodyKey: 'household.guide.quickAdd.body',
    imageLight: require('../../assets/guide/quick-add-light.jpg'),
    imageDark: require('../../assets/guide/quick-add-dark.jpg'),
  },
  {
    key: 'swipe',
    icon: 'swap-horizontal-outline',
    badgeIcon: 'checkmark-circle-outline',
    titleKey: 'household.guide.swipe.title',
    bodyKey: 'household.guide.swipe.body',
    imageLight: require('../../assets/guide/swipe-light.jpg'),
    imageDark: require('../../assets/guide/swipe-dark.jpg'),
  },
  {
    key: 'stock',
    icon: 'cube-outline',
    badgeIcon: 'add-circle-outline',
    titleKey: 'household.guide.stock.title',
    bodyKey: 'household.guide.stock.body',
    imageLight: require('../../assets/guide/stock-light.jpg'),
    imageDark: require('../../assets/guide/stock-dark.jpg'),
  },
  {
    key: 'shopping',
    icon: 'cart-outline',
    badgeIcon: 'checkmark-done-outline',
    titleKey: 'household.guide.shopping.title',
    bodyKey: 'household.guide.shopping.body',
    imageLight: require('../../assets/guide/shopping-light.jpg'),
    imageDark: require('../../assets/guide/shopping-dark.jpg'),
  },
  {
    key: 'purchased',
    icon: 'bag-check-outline',
    badgeIcon: 'cube-outline',
    titleKey: 'household.guide.purchased.title',
    bodyKey: 'household.guide.purchased.body',
    imageLight: require('../../assets/guide/purchased-light.jpg'),
    imageDark: require('../../assets/guide/purchased-dark.jpg'),
  },
  { key: 'receiptScan', icon: 'receipt-outline', badgeIcon: 'camera-outline', titleKey: 'household.guide.receiptScan.title', bodyKey: 'household.guide.receiptScan.body' },
  { key: 'productScan', icon: 'pricetag-outline', badgeIcon: 'camera-outline', titleKey: 'household.guide.productScan.title', bodyKey: 'household.guide.productScan.body' },
  { key: 'cleaning', icon: 'sparkles-outline', badgeIcon: 'calendar-outline', titleKey: 'household.guide.cleaning.title', bodyKey: 'household.guide.cleaning.body' },
  { key: 'waste', icon: 'trash-outline', badgeIcon: 'refresh-outline', titleKey: 'household.guide.waste.title', bodyKey: 'household.guide.waste.body' },
  { key: 'expenses', icon: 'cash-outline', badgeIcon: 'people-outline', titleKey: 'household.guide.expenses.title', bodyKey: 'household.guide.expenses.body' },
  { key: 'household', icon: 'people-outline', badgeIcon: 'key-outline', titleKey: 'household.guide.household.title', bodyKey: 'household.guide.household.body' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function AppGuideModal({ visible, onClose }: Props) {
  const { colors, mode } = useTheme();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  // Sul web il contenuto e' comunque limitato a WEB_MAX_WIDTH (vedi
  // webCentered): usare la larghezza intera della finestra per le slide
  // della guida le farebbe scorrere/allinearsi su una colonna molto piu'
  // larga di quella effettivamente visibile su desktop.
  const guideSlideWidth = Platform.OS === 'web' ? Math.min(windowWidth, WEB_MAX_WIDTH) : windowWidth;
  // Dimensione calcolata esplicitamente dall'altezza della finestra invece di
  // lasciar crescere l'immagine con flex dentro lo ScrollView orizzontale
  // della guida: in pratica quell'approccio non riempiva lo spazio come
  // previsto (l'immagine restava quasi invisibile). Il rapporto d'aspetto e'
  // quello reale degli screenshot ritagliati (1080x2142, senza piu' barra di
  // stato/navigazione).
  const guideImageHeight = Math.min(windowHeight * 0.5, 420);
  const guideImageWidth = guideImageHeight * (1080 / 2142);
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [guideIndex, setGuideIndex] = useState(0);
  const guideScrollRef = useRef<ScrollView>(null);

  function handleClose() {
    setGuideIndex(0);
    onClose();
  }

  useModalBackHandler(visible, handleClose);

  function scrollToGuideSlide(index: number) {
    const clamped = Math.max(0, Math.min(index, GUIDE_SLIDES.length - 1));
    guideScrollRef.current?.scrollTo({ x: clamped * guideSlideWidth, animated: true });
    setGuideIndex(clamped);
  }

  function handleGuideScrollSettle(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.x / guideSlideWidth);
    setGuideIndex(Math.max(0, Math.min(index, GUIDE_SLIDES.length - 1)));
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <SafeAreaView style={styles.guideSafeArea}>
        <View style={[styles.guideBody, webCentered]}>
          <View style={styles.guideHeader}>
            <Text style={styles.guideHeaderTitle}>{t('household.guideTitle')}</Text>
            <Pressable onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>

          <ScrollView
            ref={guideScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            // Aggiornamento continuo invece di affidarsi solo a un evento di
            // "fine scroll": onMomentumScrollEnd/onScrollEndDrag non sempre
            // scattano in modo affidabile con pagingEnabled (uno swipe lento
            // puo' far leggere la posizione prima che lo snap sia finito),
            // lasciando i puntini fermi finche' non si usa "Avanti"/"Indietro".
            // onScroll invece segue la posizione reale in tempo reale.
            onScroll={handleGuideScrollSettle}
            scrollEventThrottle={16}
            style={{ flex: 1 }}
          >
            {GUIDE_SLIDES.map((slide) => {
              const image = mode === 'dark' ? slide.imageDark : slide.imageLight;
              return (
                <View key={slide.key} style={[styles.guideSlide, { width: guideSlideWidth }]}>
                  {image ? (
                    <View style={[styles.guideSlideImageWrap, { width: guideImageWidth, height: guideImageHeight }]}>
                      <Image source={image} style={styles.guideSlideImage} resizeMode="contain" />
                    </View>
                  ) : (
                    <View style={styles.guideSlideIconWrap}>
                      <Ionicons name={slide.icon} size={40} color={colors.brand} />
                      <View style={styles.guideSlideBadge}>
                        <Ionicons name={slide.badgeIcon} size={16} color={colors.ink} />
                      </View>
                    </View>
                  )}
                  <Text style={styles.guideSlideTitle}>{t(slide.titleKey)}</Text>
                  <Text style={styles.guideSlideBody}>{t(slide.bodyKey)}</Text>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.guideDots}>
            {GUIDE_SLIDES.map((slide, i) => (
              <View key={slide.key} style={[styles.guideDot, i === guideIndex && styles.guideDotActive]} />
            ))}
          </View>

          <View style={[styles.guideNav, { paddingBottom: 16 + insets.bottom }]}>
            {guideIndex > 0 ? (
              <Pressable onPress={() => scrollToGuideSlide(guideIndex - 1)} hitSlop={8} style={styles.guideNavBack}>
                <Text style={styles.guideNavBackText}>{t('household.guideBack')}</Text>
              </Pressable>
            ) : (
              <View style={styles.guideNavBack} />
            )}
            {guideIndex < GUIDE_SLIDES.length - 1 ? (
              <PrimaryButton label={t('household.guideNext')} onPress={() => scrollToGuideSlide(guideIndex + 1)} style={styles.guideNavButton} />
            ) : (
              <PrimaryButton label={t('common.close')} onPress={handleClose} style={styles.guideNavButton} />
            )}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    guideSafeArea: { flex: 1, backgroundColor: COLORS.bg },
    guideBody: { flex: 1 },
    guideHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: COLORS.line,
    },
    guideHeaderTitle: { fontSize: 16, fontWeight: '700', color: COLORS.ink },
    guideSlide: { padding: 24, alignItems: 'center', justifyContent: 'center', gap: 12 },
    // Larghezza/altezza passate inline (vedi guideImageWidth/guideImageHeight
    // sopra, calcolate dall'altezza della finestra): qui restano solo gli
    // stili che non dipendono dalla dimensione.
    guideSlideImageWrap: {
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: COLORS.line,
      backgroundColor: COLORS.card,
    },
    guideSlideImage: { width: '100%', height: '100%' },
    guideSlideIconWrap: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: COLORS.brandBg,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    guideSlideBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: COLORS.card,
      borderWidth: 2,
      borderColor: COLORS.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    guideSlideTitle: { fontSize: 20, fontWeight: '800', color: COLORS.ink, textAlign: 'center' },
    guideSlideBody: { fontSize: 14, color: COLORS.inkSoft, textAlign: 'center', lineHeight: 21 },
    guideDots: { flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 8 },
    guideDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.line },
    guideDotActive: { backgroundColor: COLORS.brand, width: 18 },
    guideNav: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 8,
      gap: 12,
    },
    guideNavBack: { minWidth: 60, paddingVertical: 11 },
    guideNavBackText: { fontSize: 14, fontWeight: '700', color: COLORS.inkSoft },
    guideNavButton: { flex: 0, paddingHorizontal: 28 },
  });
}

export interface ColorPalette {
  bg: string;
  card: string;
  ink: string;
  inkSoft: string;
  brand: string;
  brandBg: string;
  warn: string;
  warnBg: string;
  danger: string;
  dangerBg: string;
  gold: string;
  goldBg: string;
  okBg: string;
  line: string;
  white: string;
}

export type AccentKey = 'green' | 'blue' | 'purple' | 'orange' | 'teal' | 'pink';

export const ACCENTS: Record<AccentKey, { light: string; dark: string; label: string }> = {
  green: { light: '#3F6B52', dark: '#7FBF9C', label: 'Verde' },
  blue: { light: '#2F6FA8', dark: '#7AB6E8', label: 'Blu' },
  purple: { light: '#6B4FA0', dark: '#B79BE0', label: 'Viola' },
  orange: { light: '#B8621D', dark: '#E8A560', label: 'Arancione' },
  teal: { light: '#227A7A', dark: '#5FC2C2', label: 'Verde acqua' },
  pink: { light: '#A83E6E', dark: '#E080AC', label: 'Rosa' },
};

export type ColorScheme = 'light' | 'dark';

export function buildPalette(scheme: ColorScheme, accent: AccentKey): ColorPalette {
  const brand = ACCENTS[accent][scheme];

  if (scheme === 'dark') {
    return {
      bg: '#14181A',
      card: '#1E2426',
      ink: '#EDEFE9',
      inkSoft: '#9AA79E',
      brand,
      brandBg: '#20302A',
      warn: '#E08A4F',
      warnBg: '#3A2A1C',
      danger: '#E0776A',
      dangerBg: '#3A211D',
      gold: '#D9B463',
      goldBg: '#3A311D',
      okBg: '#232B26',
      line: '#2E3538',
      white: '#FFFFFF',
    };
  }

  return {
    bg: '#EDEFE9',
    card: '#FFFFFF',
    ink: '#26332C',
    inkSoft: '#5B695F',
    brand,
    brandBg: '#E4E7DF',
    warn: '#C4571F',
    warnBg: '#FBEADC',
    danger: '#A33B2B',
    dangerBg: '#F6E2DE',
    gold: '#B98A2E',
    goldBg: '#F5EAD3',
    okBg: '#E4E7DF',
    line: '#DCDFD6',
    white: '#FFFFFF',
  };
}

/** Default light/green palette, used only as a static fallback where a React context is not available. */
export const COLORS: ColorPalette = buildPalette('light', 'green');

export interface ColorPalette {
  bg: string;
  card: string;
  ink: string;
  inkSoft: string;
  brand: string;
  brandBg: string;
  brandSoft: string;
  positive: string;
  positiveBg: string;
  warn: string;
  warnBg: string;
  danger: string;
  dangerBg: string;
  gold: string;
  goldBg: string;
  info: string;
  infoBg: string;
  okBg: string;
  line: string;
  white: string;
}

// Colore principale fisso dell'app (verde salvia): non e' piu' scelto
// dall'utente, quindi cambia solo in base al tema chiaro/scuro.
const BRAND = { light: '#4F6B47', dark: '#9CC08F' };

export type ColorScheme = 'light' | 'dark';

// Il verde di "successo" (saldo spese positivo, quota saldata) resta sempre
// verde a prescindere dal colore principale scelto: e' un significato fisso
// (soldi ricevuti), non un colore decorativo.
const POSITIVE = { light: '#3F6B52', lightBg: '#E1EDE5', dark: '#7FBF9C', darkBg: '#1E2C25' };

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(hex: string, withHex: string, amount: number): string {
  const [r1, g1, b1] = hexToRgb(hex);
  const [r2, g2, b2] = hexToRgb(withHex);
  const r = Math.round(r1 + (r2 - r1) * amount);
  const g = Math.round(g1 + (g2 - g1) * amount);
  const b = Math.round(b1 + (b2 - b1) * amount);
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function buildPalette(scheme: ColorScheme): ColorPalette {
  const brand = BRAND[scheme];

  if (scheme === 'dark') {
    return {
      bg: '#14181A',
      card: '#1F262A',
      ink: '#EDEFE9',
      inkSoft: '#9AA79E',
      brand,
      brandBg: mix(brand, '#14181A', 0.78),
      brandSoft: mix(brand, '#14181A', 0.6),
      positive: POSITIVE.dark,
      positiveBg: POSITIVE.darkBg,
      warn: '#E08A4F',
      warnBg: '#3A2A1C',
      danger: '#E0776A',
      dangerBg: '#3A211D',
      gold: '#D9B463',
      goldBg: '#3A311D',
      info: '#7AB6E8',
      infoBg: '#1C2C3A',
      okBg: '#232B26',
      line: '#3A4448',
      white: '#FFFFFF',
    };
  }

  return {
    bg: '#EDEFE9',
    card: '#FFFFFF',
    ink: '#26332C',
    inkSoft: '#5B695F',
    brand,
    brandBg: mix(brand, '#FFFFFF', 0.85),
    brandSoft: mix(brand, '#FFFFFF', 0.72),
    positive: POSITIVE.light,
    positiveBg: POSITIVE.lightBg,
    warn: '#C4571F',
    warnBg: '#FBEADC',
    danger: '#A33B2B',
    dangerBg: '#F6E2DE',
    gold: '#B98A2E',
    goldBg: '#F5EAD3',
    info: '#2F6FA8',
    infoBg: '#E1EDF5',
    okBg: '#E4E7DF',
    line: '#DCDFD6',
    white: '#FFFFFF',
  };
}

/** Default light palette, used only as a static fallback where a React context is not available. */
export const COLORS: ColorPalette = buildPalette('light');

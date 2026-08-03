// Euristiche per estrarre nome prodotto e data di scadenza dal testo OCR
// di una o due foto della confezione (fronte + retro/etichetta). Come per
// lo scontrino, l'utente rivede sempre i valori proposti prima di salvare.

const DATE_PATTERN = /\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{2,4})\b/g;

const EXPIRY_KEYWORDS = [
  'scad',
  'consumare entro',
  'consumarsi entro',
  'da consumarsi',
  'entro il',
  'best before',
  'exp',
  'tmc',
];

function toIsoDate(day: number, month: number, year: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const fullYear = year < 100 ? 2000 + year : year;
  return `${String(fullYear).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// Cerca una data preceduta da una parola chiave di scadenza sulla stessa riga
// (es. "SCAD. 12/09/2026"); se non la trova, usa la prima data valida come
// ripiego, dato che sulle etichette la scadenza e' spesso l'unica data stampata.
export function parseExpirationDate(rawText: string): string | null {
  let fallback: string | null = null;
  for (const line of rawText.split('\n')) {
    const lower = line.toLowerCase();
    const hasKeyword = EXPIRY_KEYWORDS.some((k) => lower.includes(k));
    DATE_PATTERN.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = DATE_PATTERN.exec(line))) {
      const iso = toIsoDate(Number(match[1]), Number(match[2]), Number(match[3]));
      if (!iso) continue;
      if (hasKeyword) return iso;
      if (!fallback) fallback = iso;
    }
  }
  return fallback;
}

const ONLY_NUMBERS_OR_SYMBOLS = /^[\d.,€$*x×\-\s%]+$/i;
const HAS_DATE = /\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}/;
const NAME_NOISE_KEYWORDS = [
  'ingredienti',
  'valori nutrizionali',
  'peso netto',
  'peso ',
  'lotto',
  'conservare',
  'allerg',
  'kcal',
  'kj',
  'scad',
  'consumare entro',
  'da consumarsi',
  'tmc',
  'exp',
  'produttore',
  'stabilimento',
  'www.',
  'http',
  'suggerimento di presentazione',
  'foto non vincolante',
  'immagine non vincolante',
];

function looksLikeNameLine(rawLine: string): boolean {
  const line = rawLine.trim();
  if (line.length < 3 || line.length > 40) return false;
  if (ONLY_NUMBERS_OR_SYMBOLS.test(line)) return false;
  if (HAS_DATE.test(line)) return false;
  const lower = line.toLowerCase();
  if (NAME_NOISE_KEYWORDS.some((k) => lower.includes(k))) return false;
  return /[a-zA-ZàèéìòùÀÈÉÌÒÙ]/.test(line);
}

// Il nome prodotto e' di solito la scritta piu' grande in etichetta: qui non
// abbiamo informazioni sulla dimensione del testo, quindi si sceglie la riga
// candidata piu' lunga come approssimazione ragionevole.
export function parseProductName(rawText: string): string | null {
  const candidates = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter(looksLikeNameLine);
  if (candidates.length === 0) return null;
  return candidates.reduce((best, curr) => (curr.length > best.length ? curr : best));
}

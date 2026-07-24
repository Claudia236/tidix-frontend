import { toLocalISODate } from './expiry';

const MONTHS_IT: Record<string, number> = {
  gennaio: 1, febbraio: 2, marzo: 3, aprile: 4, maggio: 5, giugno: 6,
  luglio: 7, agosto: 8, settembre: 9, ottobre: 10, novembre: 11, dicembre: 12,
};

const NUMBER_WORDS_IT: Record<string, number> = {
  primo: 1, uno: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7,
  otto: 8, nove: 9, dieci: 10, undici: 11, dodici: 12, tredici: 13, quattordici: 14,
  quindici: 15, sedici: 16, diciassette: 17, diciotto: 18, diciannove: 19, venti: 20,
  ventuno: 21, ventidue: 22, ventitre: 23, ventitré: 23, ventiquattro: 24, venticinque: 25,
  ventisei: 26, ventisette: 27, ventotto: 28, ventinove: 29, trenta: 30, trentuno: 31,
};

function wordOrDigitToNumber(text: string): number | null {
  if (/^\d+$/.test(text)) return parseInt(text, 10);
  return NUMBER_WORDS_IT[text] ?? null;
}

// Interpreta una frase pronunciata in italiano ("11 novembre 2027", "domani",
// "tra 3 giorni", "11/11/2027", ...) come data di scadenza in formato
// YYYY-MM-DD. Ritorna null se non riesce a riconoscere nessun pattern noto.
export function parseSpokenDateIT(raw: string): string | null {
  const text = raw.trim().toLowerCase().replace(/['".,;!?]/g, ' ').replace(/\s+/g, ' ');
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (/\boggi\b/.test(text)) return toLocalISODate(today);

  if (/\bdopodomani\b/.test(text)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 2);
    return toLocalISODate(d);
  }

  if (/\bdomani\b/.test(text)) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return toLocalISODate(d);
  }

  let m = text.match(/\btra\s+(\d+|[a-zàéìòù]+)\s+settiman[ae]\b/);
  if (m) {
    const n = wordOrDigitToNumber(m[1]);
    if (n !== null) {
      const d = new Date(today);
      d.setDate(d.getDate() + n * 7);
      return toLocalISODate(d);
    }
  }

  m = text.match(/\btra\s+(\d+|[a-zàéìòù]+)\s+mes[ei]\b/);
  if (m) {
    const n = wordOrDigitToNumber(m[1]);
    if (n !== null) {
      const d = new Date(today);
      d.setMonth(d.getMonth() + n);
      return toLocalISODate(d);
    }
  }

  m = text.match(/\btra\s+(\d+|[a-zàéìòù]+)\s+giorn[oi]\b/);
  if (m) {
    const n = wordOrDigitToNumber(m[1]);
    if (n !== null) {
      const d = new Date(today);
      d.setDate(d.getDate() + n);
      return toLocalISODate(d);
    }
  }

  // Formati numerici: 11/11/2027, 11-11-2027, 11.11.2027, 11/11
  m = text.match(/\b(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?\b/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    let year = today.getFullYear();
    if (m[3]) {
      year = parseInt(m[3], 10);
      if (m[3].length === 2) year += 2000;
    } else if (new Date(year, month - 1, day) < today) {
      year += 1;
    }
    const date = new Date(year, month - 1, day);
    if (date.getMonth() === month - 1 && date.getDate() === day) return toLocalISODate(date);
  }

  // "11 novembre 2027", "l'11 di novembre", "primo dicembre"
  const monthPattern = Object.keys(MONTHS_IT).join('|');
  m = text.match(new RegExp(`\\b(\\d{1,2}|[a-zàéìòù]+)\\s+(?:di\\s+)?(${monthPattern})(?:\\s+(\\d{4}))?\\b`));
  if (m) {
    const day = wordOrDigitToNumber(m[1]);
    const month = MONTHS_IT[m[2]];
    if (day !== null && month && day >= 1 && day <= 31) {
      let year = today.getFullYear();
      if (m[3]) {
        year = parseInt(m[3], 10);
      } else if (new Date(year, month - 1, day) < today) {
        year += 1;
      }
      const date = new Date(year, month - 1, day);
      if (date.getMonth() === month - 1 && date.getDate() === day) return toLocalISODate(date);
    }
  }

  return null;
}

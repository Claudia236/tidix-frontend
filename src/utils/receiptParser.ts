// Righe tipiche di scontrino che non sono mai nomi di prodotto: intestazioni,
// totali, dati fiscali/pagamento. L'elenco copre i casi comuni sugli scontrini
// italiani, ma resta un'euristica: l'utente rivede comunque l'elenco prima di
// confermare l'aggiunta alle scorte.
const NOISE_KEYWORDS = [
  'totale',
  'subtotale',
  'contanti',
  'resto',
  'sconto',
  'iva',
  'scontrino',
  'fiscale',
  'p.iva',
  'partita iva',
  'cod. fisc',
  'codice fiscale',
  'via ',
  'tel ',
  'tel.',
  'grazie',
  'arrivederci',
  'cassa',
  'cassiere',
  'operatore',
  'documento',
  'commerciale',
  'carta di credito',
  'bancomat',
  'pagamento',
  'n. ric',
  'reso',
  'punti',
  'fidelity',
  'aliq',
];

const ONLY_NUMBERS_OR_SYMBOLS = /^[\d.,€$*x×\-\s%]+$/i;
const DATE_LIKE = /\b\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}\b/;
const TIME_LIKE = /\b\d{1,2}:\d{2}(:\d{2})?\b/;

function looksLikeProductLine(rawLine: string): boolean {
  const line = rawLine.trim();
  if (line.length < 3) return false;
  if (ONLY_NUMBERS_OR_SYMBOLS.test(line)) return false;
  if (DATE_LIKE.test(line) && line.replace(DATE_LIKE, '').trim().length < 3) return false;
  if (TIME_LIKE.test(line) && line.replace(TIME_LIKE, '').trim().length < 3) return false;
  const lower = line.toLowerCase();
  if (NOISE_KEYWORDS.some((keyword) => lower.includes(keyword))) return false;
  return true;
}

// Ripulisce una riga candidata togliendo il prezzo finale, l'aliquota IVA
// (colonna che precede il prezzo, es. "4%"/"10%"/"22%") e i codici a barre
// numerici lasciati in coda (es. "POMODORI RAMATO 4% 2,49" -> "POMODORI RAMATO").
function cleanProductLine(rawLine: string): string {
  return rawLine
    .trim()
    .replace(/[€$]?\s*\d+[.,]\d{2}\s*[€$]?\s*$/, '')
    .replace(/\s+\d{1,2}%\s*$/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function parseReceiptLines(rawText: string): string[] {
  const seen = new Set<string>();
  const results: string[] = [];
  for (const rawLine of rawText.split('\n')) {
    if (!looksLikeProductLine(rawLine)) continue;
    const cleaned = cleanProductLine(rawLine);
    if (cleaned.length < 3) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(cleaned);
  }
  return results;
}

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
  'importo pagato',
  'ticket',
  'n. ric',
  'reso',
  'punti',
  'fidelity',
  'aliq',
  // Righe da scontrini/ricevute di pagamento con carta (POS), riconoscibili
  // per errore invece di un vero scontrino di spesa: terminologia del
  // circuito/terminale, mai un nome di prodotto.
  'mastercard',
  'maestro',
  'visa',
  'amex',
  'iban',
  'contactless',
  'chip',
  'terminale',
  'autorizzazione',
  'transazione',
  'circuito',
  'approvato',
  'approved',
  'premiumdebit',
  'issuer',
  'acquirer',
  'emv',
];

const ONLY_NUMBERS_OR_SYMBOLS = /^[\d.,€$*x×\-\s%]+$/i;
const DATE_LIKE = /\b\d{1,2}[/.\-]\d{1,2}[/.\-]\d{2,4}\b/;
const TIME_LIKE = /\b\d{1,2}:\d{2}(:\d{2})?\b/;
// Valuta da sola su una riga (es. "EUR" isolato su una ricevuta di pagamento):
// va confrontata sull'intera riga, non come sottostringa, per non escludere
// un prodotto il cui nome contenga per caso quelle lettere.
const CURRENCY_ONLY = /^(eur|euro|usd|gbp|chf|jpy)$/i;
// Riga di dettaglio peso/prezzo unitario per i prodotti venduti a peso o a
// pezzo (es. "Net 1,522kg x 1,29 EUR/kg", "6 PZ x 0,01 EUR/PZ", talvolta
// troncata dall'OCR in "Net 1,522kg x"): non e' mai un prodotto a se' stante,
// ma l'annotazione del prodotto scritto sulla riga subito sopra. Contenendo
// comunque un numero in formato prezzo, senza questo filtro l'euristica sul
// prezzo la scambiava per un prodotto e la pre-selezionava al posto del vero
// nome del prodotto (che spesso perde il prezzo sulla stessa riga a causa di
// come l'OCR spezza lo scontrino in righe).
const WEIGHT_OR_UNIT_DETAIL_LINE = /^(net\s+[\d.,]+\s*k?g\.?\s*x|\d+\s*pz\s*x\s*[\d.,]+)/i;
// Frammento isolato di unita' di prezzo lasciato dall'OCR quando spezza la
// riga di dettaglio sopra su piu' righe (es. "EUR/kg", "EUR/Kg", "EUR/ka").
const CURRENCY_UNIT_ONLY = /^eur\s*\/\s*[a-z]{2,3}\.?$/i;
// Riga che termina con un importo negativo (es. "APP CIOCC.85% -0,56"): e'
// uno sconto/abbuono applicato al prodotto sulla riga sopra, mai un prodotto
// a se' stante - non sempre riconoscibile dalla sola parola "sconto" (es.
// gli sconti automatici da app fedelta').
const NEGATIVE_PRICE_LINE = /-\s*\d+[.,]\d{2}\s*[€$]?\s*$/;
// Codice/ID che mescola lettere e cifre (numeri terminale, codici
// transazione, seriali carta: "D2290...", "88S25001909",
// "P40OPTus-806821569"): un vero nome di prodotto scritto tutto attaccato è
// raro e comunque quasi mai contiene sia lettere che cifre insieme.
const ALNUM_CODE_TOKEN = /^[A-Za-z0-9][A-Za-z0-9\-.]*$/;

function isAlnumCodeToken(token: string): boolean {
  if (!ALNUM_CODE_TOKEN.test(token)) return false;
  return /[A-Za-z]/.test(token) && /\d/.test(token);
}

// Alcuni terminali stampano l'ID su piu' token separati da uno spazio (es.
// "D2290 10126255155840864252"): se OGNI parola della riga e' a sua volta un
// codice o una sequenza numerica, la riga intera e' un ID, non un prodotto -
// un vero nome di prodotto ha sempre almeno una parola "di senso compiuto"
// (solo lettere, senza cifre).
function isAllCodeTokens(line: string): boolean {
  const tokens = line.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return false;
  return tokens.every((token) => isAlnumCodeToken(token) || /^\d+$/.test(token));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Confronto a parola intera (non sottostringa): "chip" da solo non deve far
// scartare "PATATINE CHIPS", ne' "iva" deve far scartare "OLIVA" - un errore
// concreto gia' capitato con la corrispondenza a sottostringa usata in
// precedenza.
const NOISE_KEYWORD_PATTERNS = NOISE_KEYWORDS.map(
  (keyword) => new RegExp(`\\b${escapeRegExp(keyword.trim())}\\b`, 'i')
);

function looksLikeProductLine(rawLine: string): boolean {
  const line = rawLine.trim();
  if (line.length < 3) return false;
  if (ONLY_NUMBERS_OR_SYMBOLS.test(line)) return false;
  if (CURRENCY_ONLY.test(line)) return false;
  if (WEIGHT_OR_UNIT_DETAIL_LINE.test(line)) return false;
  if (CURRENCY_UNIT_ONLY.test(line)) return false;
  if (NEGATIVE_PRICE_LINE.test(line)) return false;
  if (isAllCodeTokens(line)) return false;
  if (DATE_LIKE.test(line) && line.replace(DATE_LIKE, '').trim().length < 3) return false;
  if (TIME_LIKE.test(line) && line.replace(TIME_LIKE, '').trim().length < 3) return false;
  if (NOISE_KEYWORD_PATTERNS.some((pattern) => pattern.test(line))) return false;
  return true;
}

const PRICE_ON_LINE = /[€$]?\s*\d+[.,]\d{2}\s*[€$]?/;
const PRICE_ONLY_LINE = /^[€$]?\s*\d+[.,]\d{2}\s*[€$]?$/;

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

export interface ParsedReceiptLine {
  text: string;
  // Un prezzo accanto alla riga (sulla stessa riga o su quella successiva,
  // per gli scontrini in cui l'OCR separa nome e prezzo su righe diverse) è
  // il segnale piu' affidabile che la riga sia davvero un prodotto: usato per
  // pre-selezionare solo le righe piu' probabili e lasciare le altre da
  // rivedere manualmente.
  confident: boolean;
}

export function parseReceiptLines(rawText: string): ParsedReceiptLine[] {
  const rawLines = rawText.split('\n');
  const seen = new Set<string>();
  const results: ParsedReceiptLine[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    if (!looksLikeProductLine(rawLine)) continue;
    const cleaned = cleanProductLine(rawLine);
    if (cleaned.length < 3) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    const hasPriceSameLine = PRICE_ON_LINE.test(rawLine);
    const nextLine = rawLines[i + 1]?.trim();
    const hasPriceNextLine = !!nextLine && PRICE_ONLY_LINE.test(nextLine);
    results.push({ text: cleaned, confident: hasPriceSameLine || hasPriceNextLine });
  }
  return results;
}

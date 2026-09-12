import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Una foto scattata con la fotocamera del telefono e' tipicamente 8-12+
// megapixel: il riconoscimento testo (ML Kit) scala con la risoluzione
// dell'immagine, quindi passargliela cosi' com'e' rallenta l'OCR senza
// benefici (il testo di uno scontrino/etichetta resta leggibile ben sotto
// quella risoluzione). 1600px sul lato piu' lungo e' un compromesso comune
// che mantiene il testo nitido riducendo sensibilmente i tempi di analisi.
const MAX_DIMENSION = 1600;

/**
 * Ridimensiona un'immagine perche' il lato piu' lungo non superi
 * MAX_DIMENSION, preservando le proporzioni. Se l'immagine e' gia' entro il
 * limite (es. scelta dalla galleria, o gia' compressa), la restituisce
 * invariata senza fare lavoro inutile ne' ingrandirla.
 */
export async function resizeForRecognition(uri: string, width: number, height: number): Promise<string> {
  const longestSide = Math.max(width, height);
  if (longestSide <= MAX_DIMENSION) return uri;

  const context = ImageManipulator.manipulate(uri);
  if (width >= height) {
    context.resize({ width: MAX_DIMENSION });
  } else {
    context.resize({ height: MAX_DIMENSION });
  }
  const image = await context.renderAsync();
  const result = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
  return result.uri;
}

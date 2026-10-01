import { Platform } from 'react-native';
import { apiClient } from './client';

export const receiptsApi = {
  // Carica la foto dello scontrino al backend, che la inoltra a Claude e
  // restituisce direttamente la lista pulita dei prodotti riconosciuti (vedi
  // ReceiptScanService lato backend) - sostituisce l'OCR on-device + il
  // parser a regex usati in precedenza.
  scan: async (uri: string): Promise<string[]> => {
    const formData = new FormData();
    const headers: Record<string, string> = {};

    if (Platform.OS === 'web') {
      // Sul web FormData e' quella nativa del browser: il trucco
      // {uri, name, type} (riconosciuto solo dallo stack di rete nativo di
      // iOS/Android) qui non produce un vero file, serve un Blob reale
      // ottenuto rileggendo la uri. Niente Content-Type esplicito: il
      // browser calcola da solo l'header con il boundary corretto, e
      // impostarlo a mano (senza boundary) romperebbe il parsing multipart
      // lato server.
      const blob = await (await fetch(uri)).blob();
      formData.append('image', blob, 'receipt.jpg');
    } else {
      formData.append('image', {
        uri,
        name: 'receipt.jpg',
        type: 'image/jpeg',
      } as unknown as Blob);
      headers['Content-Type'] = 'multipart/form-data';
    }

    const response = await apiClient.post<{ items: string[] }>('/api/receipts/scan', formData, {
      headers,
      // Una chiamata con immagine verso un modello con visione richiede piu'
      // tempo del timeout di default: generoso abbastanza da coprire sia il
      // "risveglio" del backend su Render sia la generazione della risposta.
      timeout: 60000,
    });
    return response.data.items;
  },
};

import { apiClient } from './client';

export const receiptsApi = {
  // Carica la foto dello scontrino al backend, che la inoltra a Claude e
  // restituisce direttamente la lista pulita dei prodotti riconosciuti (vedi
  // ReceiptScanService lato backend) - sostituisce l'OCR on-device + il
  // parser a regex usati in precedenza.
  scan: async (uri: string): Promise<string[]> => {
    const formData = new FormData();
    formData.append('image', {
      uri,
      name: 'receipt.jpg',
      type: 'image/jpeg',
    } as unknown as Blob);
    const response = await apiClient.post<{ items: string[] }>('/api/receipts/scan', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      // Una chiamata con immagine verso un modello con visione richiede piu'
      // tempo del timeout di default: generoso abbastanza da coprire sia il
      // "risveglio" del backend su Render sia la generazione della risposta.
      timeout: 60000,
    });
    return response.data.items;
  },
};

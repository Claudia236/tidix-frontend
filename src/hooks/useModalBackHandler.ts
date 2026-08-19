import { useEffect } from 'react';
import { BackHandler, Platform } from 'react-native';

/**
 * Chiude un popup quando si preme il tasto/gesto Indietro di Android, senza
 * far navigare indietro anche la schermata sotto. Il solo onRequestClose di
 * Modal non e' sempre sufficiente (es. non scatta in modo affidabile con la
 * New Architecture abilitata su alcune versioni di React Native), quindi
 * registriamo esplicitamente un listener hardwareBackPress finche' il popup
 * e' visibile: ritornando true consumiamo l'evento, cosi' la schermata sotto
 * non reagisce a sua volta al back.
 */
export function useModalBackHandler(visible: boolean, onClose: () => void) {
  useEffect(() => {
    if (Platform.OS === 'web' || !visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => subscription.remove();
  }, [visible, onClose]);
}

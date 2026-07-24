import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import { useEffect, useState } from 'react';
import { showAlert } from '../components/AppAlert';
import { useI18n } from '../i18n/I18nContext';

// Dettatura vocale generica per compilare campi di testo: target identifica
// quale campo dell'form chiamante deve ricevere la trascrizione (un solo
// riconoscimento alla volta, condiviso dal modulo nativo).
export function useVoiceDictation<T extends string>(onResult: (target: T, transcript: string) => void) {
  const { t } = useI18n();
  const [available, setAvailable] = useState(false);
  const [target, setTarget] = useState<T | null>(null);

  useEffect(() => {
    setAvailable(ExpoSpeechRecognitionModule.isRecognitionAvailable());
  }, []);

  useSpeechRecognitionEvent('end', () => setTarget(null));

  useSpeechRecognitionEvent('result', (event) => {
    if (!target || !event.isFinal) return;
    const transcript = event.results[0]?.transcript?.trim();
    if (transcript) onResult(target, transcript);
    setTarget(null);
  });

  useSpeechRecognitionEvent('error', (event) => {
    setTarget(null);
    if (event.error === 'not-allowed') {
      showAlert(t('common.error'), t('itemForm.voice.permissionDenied'));
    } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
      showAlert(t('common.error'), t('itemForm.voice.error'));
    }
  });

  async function start(nextTarget: T) {
    if (target) {
      ExpoSpeechRecognitionModule.stop();
      return;
    }
    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      showAlert(t('common.error'), t('itemForm.voice.permissionDenied'));
      return;
    }
    setTarget(nextTarget);
    ExpoSpeechRecognitionModule.start({ lang: 'it-IT', interimResults: false });
  }

  return { available, target, start };
}

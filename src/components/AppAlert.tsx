import React, { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useI18n } from '../i18n/I18nContext';
import { useModalBackHandler } from '../hooks/useModalBackHandler';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
}

const EMPTY_STATE: AlertState = { visible: false, title: '', buttons: [] };

let setStateRef: ((state: AlertState) => void) | null = null;
let defaultOkText = 'OK';

/**
 * Sostituto di React Native `Alert.alert` che funziona anche sul web:
 * su react-native-web `Alert.alert` e' un no-op ("static alert() {}"),
 * quindi le conferme di eliminazione e i messaggi di errore non
 * comparivano affatto sul sito. Stessa firma di Alert.alert per poter
 * sostituire le chiamate esistenti senza cambiarne la struttura.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]) {
  const finalButtons = buttons && buttons.length > 0 ? buttons : [{ text: defaultOkText }];
  setStateRef?.({ visible: true, title, message, buttons: finalButtons });
}

export function AppAlertHost() {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [state, setState] = useState<AlertState>(EMPTY_STATE);

  useEffect(() => {
    defaultOkText = t('common.ok');
  }, [t]);

  useEffect(() => {
    setStateRef = setState;
    return () => {
      setStateRef = null;
    };
  }, []);

  function handlePress(button: AlertButton) {
    setState(EMPTY_STATE);
    button.onPress?.();
  }

  useModalBackHandler(state.visible, () => setState(EMPTY_STATE));

  return (
    <Modal visible={state.visible} transparent animationType="fade" onRequestClose={() => setState(EMPTY_STATE)}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>{state.title}</Text>
          {state.message ? <Text style={styles.message}>{state.message}</Text> : null}
          <View style={styles.actions}>
            {state.buttons.map((button, index) => (
              <Pressable key={index} onPress={() => handlePress(button)} style={styles.button}>
                <Text
                  style={[
                    styles.buttonText,
                    button.style === 'destructive' && styles.destructiveText,
                    button.style === 'cancel' && styles.cancelText,
                  ]}
                >
                  {button.text}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, gap: 14, width: '100%', maxWidth: 360 },
    title: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
    message: { fontSize: 13, color: COLORS.inkSoft, lineHeight: 18 },
    actions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 16, marginTop: 4 },
    button: { paddingVertical: 4 },
    buttonText: { fontSize: 14, fontWeight: '700', color: COLORS.brand },
    cancelText: { color: COLORS.inkSoft },
    destructiveText: { color: COLORS.danger },
  });
}

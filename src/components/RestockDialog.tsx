import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme/colors';
import { DatePickerField } from './DatePickerField';
import { PrimaryButton } from './PrimaryButton';

export interface RestockResult {
  mode: 'same' | 'new';
  expirationDate: string | null;
}

interface Props {
  visible: boolean;
  itemName: string;
  currentExpirationDate: string | null;
  onConfirm: (result: RestockResult) => void;
  onCancel: () => void;
}

export function RestockDialog({ visible, itemName, currentExpirationDate, onConfirm, onCancel }: Props) {
  const [choosingNewDate, setChoosingNewDate] = useState(false);
  const [newDate, setNewDate] = useState<string | null>(currentExpirationDate);

  useEffect(() => {
    if (visible) {
      setChoosingNewDate(false);
      setNewDate(currentExpirationDate);
    }
  }, [visible, currentExpirationDate]);

  function handleSame() {
    onConfirm({ mode: 'same', expirationDate: null });
  }

  function handleConfirmNewDate() {
    onConfirm({ mode: 'new', expirationDate: newDate });
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>Hai ricomprato "{itemName}"</Text>

          {!choosingNewDate ? (
            <>
              <Text style={styles.subtitle}>
                La scadenza è la stessa di prima
                {currentExpirationDate ? ` (${currentExpirationDate})` : ' (nessuna scadenza impostata)'}, oppure è cambiata?
              </Text>
              <View style={styles.actions}>
                <PrimaryButton label="Stessa" onPress={handleSame} style={{ flex: 1 }} />
                <PrimaryButton
                  label="Nuova data"
                  variant="secondary"
                  onPress={() => setChoosingNewDate(true)}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.subtitle}>
                Verrà aggiunta una nuova voce separata nelle scorte con questa scadenza, senza toccare quella già in giacenza.
              </Text>
              <DatePickerField value={newDate} onChange={setNewDate} />
              <PrimaryButton label="Conferma" onPress={handleConfirmNewDate} />
            </>
          )}

          <Pressable onPress={onCancel} hitSlop={8}>
            <Text style={styles.cancel}>Annulla</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, gap: 14, width: '100%', maxWidth: 360 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.ink },
  subtitle: { fontSize: 13, color: COLORS.inkSoft, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancel: { textAlign: 'center', fontSize: 13, color: COLORS.inkSoft, marginTop: 4 },
});

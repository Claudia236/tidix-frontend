import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

export interface FabMenuAction {
  key: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  color: string;
  onPress: () => void;
}

interface Props {
  // Modalita' singola (default): un solo pulsante che naviga/attiva subito onPress.
  onPress?: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  // Modalita' menu: tocca per aprire un ventaglio di azioni.
  actions?: FabMenuAction[];
  bottom?: number;
}

export function AddFab({ onPress, icon = 'add', actions, bottom = 116 }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [open, setOpen] = useState(false);

  if (actions && actions.length > 0) {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {open ? <Pressable style={styles.backdrop} onPress={() => setOpen(false)} /> : null}
        {open
          ? actions.map((action, i) => (
              <Pressable
                key={action.key}
                style={[styles.menuAction, { bottom: bottom + 58 * (i + 1), right: 20 }]}
                onPress={() => {
                  setOpen(false);
                  action.onPress();
                }}
              >
                <Text style={styles.menuActionLabel}>{action.label}</Text>
                <View style={[styles.menuActionIcon, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon} size={18} color={colors.white} />
                </View>
              </Pressable>
            ))
          : null}
        <Pressable style={[styles.fab, { bottom, right: 20 }]} onPress={() => setOpen((v) => !v)}>
          <Ionicons name={open ? 'close' : 'add'} size={22} color={colors.white} />
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      style={[styles.fab, { bottom, right: 20 }]}
      onPress={onPress ?? (() => router.push('/(app)/item/new'))}
    >
      <Ionicons name={icon} size={22} color={colors.white} />
    </Pressable>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    fab: {
      position: 'absolute',
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: COLORS.brand,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
    menuAction: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    menuActionLabel: {
      backgroundColor: COLORS.card,
      color: COLORS.ink,
      fontSize: 12,
      fontWeight: '700',
      borderRadius: 8,
      paddingHorizontal: 10,
      paddingVertical: 6,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    menuActionIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 3 },
      elevation: 3,
    },
  });
}

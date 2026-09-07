import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

const WIDTH = 46;
const HEIGHT = 26;
const PADDING = 3;
const THUMB_SIZE = HEIGHT - PADDING * 2;

interface Props {
  value: boolean;
  onValueChange: () => void;
  disabled?: boolean;
}

// Interruttore disegnato su misura (non lo Switch nativo di sistema): su
// alcuni Android/skin OEM lo Switch nativo ignora in parte trackColor/
// thumbColor (es. la pallina non risultava bianca ma un colore diverso,
// e in stato "disabled" un grigio diverso da tutti gli altri), risultando
// incoerente da riga a riga. Qui i colori sono sempre quelli scelti.
export function ToggleSwitch({ value, onValueChange, disabled }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const progress = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: value ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [value, progress]);

  const trackColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.line, colors.brand],
  });
  const thumbTranslate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, WIDTH - THUMB_SIZE - PADDING * 2],
  });

  return (
    <Pressable onPress={disabled ? undefined : onValueChange} disabled={disabled} hitSlop={6}>
      <Animated.View style={[styles.track, { backgroundColor: trackColor }, disabled && styles.disabled]}>
        <Animated.View style={[styles.thumb, { transform: [{ translateX: thumbTranslate }] }]} />
      </Animated.View>
    </Pressable>
  );
}

function createStyles(COLORS: ColorPalette) {
  return StyleSheet.create({
    track: {
      width: WIDTH,
      height: HEIGHT,
      borderRadius: HEIGHT / 2,
      padding: PADDING,
      justifyContent: 'center',
    },
    disabled: { opacity: 0.5 },
    thumb: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: THUMB_SIZE / 2,
      backgroundColor: COLORS.white,
    },
  });
}

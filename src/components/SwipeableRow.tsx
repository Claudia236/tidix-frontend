import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import type { ColorPalette } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

export interface SwipeAction {
  onTrigger: () => void;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
}

interface Props {
  children: React.ReactNode;
  // Trascinare la riga verso destra rivela questa azione a sinistra.
  leftAction?: SwipeAction;
  // Trascinare la riga verso sinistra rivela questa azione a destra.
  rightAction?: SwipeAction;
  borderRadius?: number;
  marginBottom?: number;
}

// Wrapper di swipe-to-reveal riutilizzato in tutte le liste (scorte, lista
// della spesa, acquistati, panoramica, pulizie): aprire il lato rivela
// l'azione, che pero' non resta "a bottone premibile" ma scatta subito e la
// riga si richiude, per restare coerente con un gesto rapido invece che un
// secondo tocco.
export function SwipeableRow({ children, leftAction, rightAction, borderRadius = 10, marginBottom = 6 }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(borderRadius, marginBottom), [borderRadius, marginBottom]);
  const ref = useRef<Swipeable>(null);

  function renderAction(action: SwipeAction, align: 'flex-start' | 'flex-end') {
    return (progress: Animated.AnimatedInterpolation<number>) => {
      const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1], extrapolate: 'clamp' });
      return (
        <View style={[styles.action, { backgroundColor: action.color, alignItems: align }]}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <Ionicons name={action.icon} size={20} color={colors.white} />
          </Animated.View>
        </View>
      );
    };
  }

  return (
    <Swipeable
      ref={ref}
      renderLeftActions={leftAction ? renderAction(leftAction, 'flex-start') : undefined}
      renderRightActions={rightAction ? renderAction(rightAction, 'flex-end') : undefined}
      overshootLeft={false}
      overshootRight={false}
      onSwipeableOpen={(direction) => {
        ref.current?.close();
        if (direction === 'left') leftAction?.onTrigger();
        if (direction === 'right') rightAction?.onTrigger();
      }}
    >
      {children}
    </Swipeable>
  );
}

function createStyles(borderRadius: number, marginBottom: number) {
  return StyleSheet.create({
    action: {
      flex: 1,
      borderRadius,
      marginBottom,
      justifyContent: 'center',
      paddingHorizontal: 20,
    },
  });
}

export function deleteAction(colors: ColorPalette, onTrigger: () => void): SwipeAction {
  return { onTrigger, icon: 'trash-outline', color: colors.danger };
}

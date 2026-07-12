import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { COLORS } from '../theme/colors';

interface Props extends Omit<TextInputProps, 'secureTextEntry'> {
  label: string;
  error?: string;
}

export function PasswordField({ label, error, style, ...rest }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          placeholderTextColor={COLORS.inkSoft}
          secureTextEntry={!visible}
          style={[styles.input, error ? styles.inputError : null, style]}
          {...rest}
        />
        <Pressable onPress={() => setVisible((v) => !v)} hitSlop={8} style={styles.toggle}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.inkSoft} />
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%' },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: COLORS.inkSoft,
    marginBottom: 6,
  },
  inputWrap: { position: 'relative', justifyContent: 'center' },
  input: {
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingRight: 40,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.ink,
    backgroundColor: COLORS.white,
  },
  inputError: {
    borderColor: COLORS.danger,
  },
  toggle: {
    position: 'absolute',
    right: 10,
    height: '100%',
    justifyContent: 'center',
  },
  error: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.danger,
  },
});

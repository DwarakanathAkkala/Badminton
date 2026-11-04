import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';

export default function Button({
  title, onPress, style, variant = 'primary', disabled,
}: {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'ghost' && styles.ghost,
        variant === 'danger' && styles.danger,
        pressed && { opacity: 0.75 },
        disabled && { opacity: 0.5 },
        style,
      ]}>
      <Text style={[styles.txt, variant === 'ghost' && { color: '#0d6efd' }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 10, alignItems: 'center' },
  primary: { backgroundColor: '#0d6efd' },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#0d6efd' },
  danger: { backgroundColor: '#dc3545' },
  txt: { color: '#fff', fontWeight: '600' },
});
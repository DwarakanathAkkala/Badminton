import React from 'react';
import { TextInput, Text, View, StyleSheet, TextInputProps } from 'react-native';

export default function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput {...props} style={styles.input} placeholderTextColor="#999" />
    </View>
  );
}
const styles = StyleSheet.create({
  label: { fontWeight: '600', marginBottom: 6, color: '#333' },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10,
    fontSize: 16, backgroundColor: '#fafafa',
  },
});
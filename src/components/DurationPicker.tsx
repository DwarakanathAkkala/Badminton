import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { DURATION_OPTIONS, durationLabel } from '../utils/calculations';

type Props = {
  value: number;
  onChange: (v: number) => void;
};

export default function DurationPicker({ value, onChange }: Props) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>Duration</Text>
      <View style={styles.wrap}>
        {DURATION_OPTIONS.map(m => {
          const on = m === value;
          return (
            <Pressable
              key={m}
              onPress={() => onChange(m)}
              style={[styles.chip, on ? styles.chipOn : null]}>
              <Text style={{ color: on ? '#fff' : '#333', fontWeight: '600' }}>
                {durationLabel(m)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600', marginBottom: 6, color: '#333' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipOn: { backgroundColor: '#0d6efd', borderColor: '#0d6efd' },
});
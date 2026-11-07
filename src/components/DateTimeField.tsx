import React, { useState } from 'react';
import { Platform, View, Text, Pressable, StyleSheet } from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';

type Props = {
  label: string;
  value: Date;
  onChange: (d: Date) => void;
  mode?: 'date' | 'time';
};

export default function DateTimeField({ label, value, onChange, mode = 'date' }: Props) {
  const [show, setShow] = useState(false);

  const displayText =
    mode === 'date'
      ? value.toLocaleDateString()
      : value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // ---- WEB: use a native <input> but hidden until clicked ----
  if (Platform.OS === 'web') {
    const inputValue =
      mode === 'date'
        ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(
            value.getDate(),
          ).padStart(2, '0')}`
        : `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(
            2,
            '0',
          )}`;

    return (
      <View style={{ marginBottom: 12 }}>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.field}>
          <Text style={styles.fieldText}>{displayText}</Text>
          {React.createElement('input', {
            type: mode === 'date' ? 'date' : 'time',
            value: inputValue,
            onChange: (e: { target: { value: string } }) => {
              const v = e.target.value;
              if (!v) return;
              const next = new Date(value);
              if (mode === 'date') {
                const [y, m, d] = v.split('-').map(Number);
                next.setFullYear(y, m - 1, d);
              } else {
                const [h, mm] = v.split(':').map(Number);
                next.setHours(h, mm);
              }
              onChange(next);
            },
            style: {
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              border: 'none',
              background: 'transparent',
            },
          })}
        </View>
      </View>
    );
  }

  // ---- NATIVE: tap → open picker popup ----
  const onNativeChange = (event: DateTimePickerEvent, selected?: Date) => {
    // Android fires "dismissed" when user cancels
    if (Platform.OS === 'android') setShow(false);
    if (event.type === 'set' && selected) {
      onChange(selected);
    }
  };

  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable onPress={() => setShow(true)} style={styles.field}>
        <Text style={styles.fieldText}>{displayText}</Text>
        <Text style={styles.chevron}>{mode === 'date' ? '📅' : '🕒'}</Text>
      </Pressable>
      {show && (
        <DateTimePicker
          value={value}
          mode={mode}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onNativeChange}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: '600', marginBottom: 6, color: '#333' },
  field: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#fafafa',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldText: { fontSize: 16, color: '#222' },
  chevron: { fontSize: 16, marginLeft: 8 },
});
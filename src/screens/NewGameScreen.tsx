import React, { useState } from 'react';
import { ScrollView, Text, View, StyleSheet, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStack } from '../../App';
import { useApp } from '../context/AppContext';
import Field from '../components/Field';
import Button from '../components/Button';
import Card from '../components/Card';
import { Game, PlayerPayment } from '../types';

const uid = () => Math.random().toString(36).slice(2, 10);

export default function NewGameScreen({ navigation }: NativeStackScreenProps<RootStack, 'NewGame'>) {
  const { state, addGame } = useApp();
  const [venue, setVenue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [courtCost, setCourtCost] = useState('600');
  const [shuttlesUsed, setShuttlesUsed] = useState('2');
  const [shuttleUnitCost, setShuttleUnitCost] = useState('120');
  const [selected, setSelected] = useState<string[]>(state.players.map(p => p.id));
  const [extraLabel, setExtraLabel] = useState('');
  const [extraAmt, setExtraAmt] = useState('');
  const [extras, setExtras] = useState<{ id: string; label: string; amount: number }[]>([]);

  const toggle = (id: string) =>
    setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));

  const total =
    Number(courtCost || 0) +
    Number(shuttlesUsed || 0) * Number(shuttleUnitCost || 0) +
    extras.reduce((a, b) => a + b.amount, 0);
  const share = selected.length ? total / selected.length : 0;

  const save = () => {
    const payments: PlayerPayment[] = selected.map(id => ({ playerId: id, amount: 0, paid: false }));
    const g: Game = {
      id: uid(),
      date: new Date(date).toISOString(),
      venue: venue || 'Court',
      playerIds: selected,
      hostId: state.myPlayerId,
      courtCost: Number(courtCost || 0),
      shuttlesUsed: Number(shuttlesUsed || 0),
      shuttleUnitCost: Number(shuttleUnitCost || 0),
      extraExpenses: extras,
      payments,
      completed: false,
    };
    addGame(g);
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, maxWidth: 900, alignSelf: 'center', width: '100%' }}>
      <Card>
        <Field label="Venue" value={venue} onChangeText={setVenue} placeholder="Court name" />
        <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
        <Field label="Court Cost (₹)" value={courtCost} onChangeText={setCourtCost} keyboardType="numeric" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Field label="Shuttles Used" value={shuttlesUsed} onChangeText={setShuttlesUsed} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Shuttle Unit Cost (₹)" value={shuttleUnitCost} onChangeText={setShuttleUnitCost} keyboardType="numeric" />
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.title}>Players ({selected.length} selected)</Text>
        <View style={styles.wrap}>
          {state.players.map(p => {
            const on = selected.includes(p.id);
            return (
              <Pressable
                key={p.id}
                onPress={() => toggle(p.id)}
                style={[styles.chip, on ? styles.chipOn : null]}>
                <Text style={{ color: on ? '#fff' : '#333' }}>{p.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text style={styles.title}>Extra Expenses</Text>
        {extras.map(e => (
          <Text key={e.id}>• {e.label} — ₹{e.amount}</Text>
        ))}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          <View style={{ flex: 2 }}>
            <Field label="Label" value={extraLabel} onChangeText={setExtraLabel} placeholder="Water etc." />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="₹" value={extraAmt} onChangeText={setExtraAmt} keyboardType="numeric" />
          </View>
        </View>
        <Button
          title="Add Extra"
          variant="ghost"
          onPress={() => {
            if (!extraLabel || !extraAmt) return;
            setExtras(x => [...x, { id: uid(), label: extraLabel, amount: Number(extraAmt) }]);
            setExtraLabel(''); setExtraAmt('');
          }}
        />
      </Card>

      <Card>
        <Text style={styles.title}>Summary</Text>
        <Text>Total: ₹{total.toFixed(0)}</Text>
        <Text>Per Player: ₹{share.toFixed(0)}</Text>
        <Text style={{ marginTop: 6, color: '#666' }}>Fill payments in detail screen after game.</Text>
      </Card>

      <Button title="Create Game" onPress={save} disabled={selected.length === 0} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: '700', marginBottom: 8, fontSize: 16 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: '#f0f0f0', borderWidth: 1, borderColor: '#ddd',
  },
  chipOn: { backgroundColor: '#0d6efd', borderColor: '#0d6efd' },
});
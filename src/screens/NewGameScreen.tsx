import React, { useState } from 'react';
import { ScrollView, Text, View, StyleSheet, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStack } from '../../App';
import { useApp } from '../context/AppContext';
import Field from '../components/Field';
import Button from '../components/Button';
import Card from '../components/Card';
import DateTimeField from '../components/DateTimeField';
import DurationPicker from '../components/DurationPicker';
import { ExtraExpense, Game, PlayerPayment } from '../types';
import { uid } from '../db/database';

export default function NewGameScreen({ navigation }: NativeStackScreenProps<RootStack, 'NewGame'>) {
  const { state, addGame, addPlayer } = useApp();
  const [courtName, setCourtName] = useState('');
  const [when, setWhen] = useState(new Date());
  const [numCourts, setNumCourts] = useState('1');
  const [duration, setDuration] = useState(60);
  const [courtCost, setCourtCost] = useState('600');
  const [shuttlesUsed, setShuttlesUsed] = useState('2');
  const [shuttleAmount, setShuttleAmount] = useState('240');
  const [shuttleBroken, setShuttleBroken] = useState(false);
  const [shuttlePackId, setShuttlePackId] = useState<string | undefined>(
    state.shuttlePacks[0]?.id,
  );
  const [selected, setSelected] = useState<string[]>(state.players.map(p => p.id));
  const [extraLabel, setExtraLabel] = useState('');
  const [extraAmt, setExtraAmt] = useState('');
  const [extras, setExtras] = useState<ExtraExpense[]>([]);

  // inline "add player" state
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerPhone, setNewPlayerPhone] = useState('');

  const toggle = (id: string) =>
    setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));

  const createInlinePlayer = async () => {
    if (!newPlayerName.trim()) return;
    const id = uid();
    await addPlayer({
      id,
      name: newPlayerName.trim(),
      phone: newPlayerPhone.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    // auto-select the new player
    setSelected(s => [...s, id]);
    setNewPlayerName('');
    setNewPlayerPhone('');
    setShowAddPlayer(false);
  };

  const total =
    Number(courtCost || 0) +
    Number(shuttleAmount || 0) +
    extras.reduce((a, b) => a + b.amount, 0);
  const share = selected.length ? total / selected.length : 0;

  const save = async () => {
    const payments: PlayerPayment[] = selected.map(id => ({
      playerId: id,
      amount: 0,
      paid: false,
    }));
    const g: Game = {
      id: uid(),
      date: when.toISOString(),
      courtName: courtName || 'Court',
      numCourts: Number(numCourts || 1),
      durationMinutes: duration,
      playerIds: selected,
      hostId: state.myPlayerId,
      courtCost: Number(courtCost || 0),
      shuttlesUsed: Number(shuttlesUsed || 0),
      shuttleAmountCollected: Number(shuttleAmount || 0),
      extraExpenses: extras,
      payments,
      shuttlePackId,
      shuttleBroken,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    await addGame(g);
    navigation.goBack();
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, maxWidth: 900, alignSelf: 'center', width: '100%' }}
      keyboardShouldPersistTaps="handled">
      <Card>
        <Field label="Venue" value={courtName} onChangeText={setCourtName} placeholder="Court name" />
        <DateTimeField label="Date" value={when} onChange={setWhen} mode="date" />
        <DateTimeField label="Start Time" value={when} onChange={setWhen} mode="time" />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Field
              label="No. of Courts"
              value={numCourts}
              onChangeText={setNumCourts}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 2 }}>
            <DurationPicker value={duration} onChange={setDuration} />
          </View>
        </View>
        <Field label="Court Cost (₹)" value={courtCost} onChangeText={setCourtCost} keyboardType="numeric" />
      </Card>

      <Card>
        <Text style={styles.title}>Shuttles</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Field
              label="Count Used"
              value={shuttlesUsed}
              onChangeText={setShuttlesUsed}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label="Shuttle Amount (₹)"
              value={shuttleAmount}
              onChangeText={setShuttleAmount}
              keyboardType="numeric"
            />
          </View>
        </View>
        {state.shuttlePacks.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ fontWeight: '600', marginBottom: 6 }}>Linked Pack</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {state.shuttlePacks.map(pk => {
                const on = pk.id === shuttlePackId;
                return (
                  <Pressable
                    key={pk.id}
                    onPress={() => setShuttlePackId(pk.id)}
                    style={[styles.chip, on ? styles.chipOn : null]}>
                    <Text style={{ color: on ? '#fff' : '#333' }}>
                      {pk.code} ({pk.remaining}/{pk.count})
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
        <Pressable
          onPress={() => setShuttleBroken(v => !v)}
          style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12 }}>
          <View style={[styles.checkbox, shuttleBroken && styles.checkboxOn]}>
            {shuttleBroken && <Text style={{ color: '#fff', fontWeight: '900' }}>✓</Text>}
          </View>
          <Text style={{ marginLeft: 8 }}>A shuttle broke this game (auto-decrement pack)</Text>
        </Pressable>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.title}>Players ({selected.length} selected)</Text>
          <Button
            title={showAddPlayer ? 'Close' : '+ New Player'}
            variant="ghost"
            onPress={() => setShowAddPlayer(v => !v)}
            style={{ paddingVertical: 6, paddingHorizontal: 10 }}
          />
        </View>

        {showAddPlayer && (
          <View style={{ marginTop: 10, marginBottom: 10 }}>
            <Field
              label="Name"
              value={newPlayerName}
              onChangeText={setNewPlayerName}
              placeholder="Player name"
            />
            <Field
              label="Phone (optional)"
              value={newPlayerPhone}
              onChangeText={setNewPlayerPhone}
              placeholder="+91..."
              keyboardType="phone-pad"
            />
            <Button
              title="Add & Select"
              onPress={createInlinePlayer}
              disabled={!newPlayerName.trim()}
            />
          </View>
        )}

        {state.players.length === 0 && (
          <Text style={{ color: '#666', marginBottom: 8 }}>
            No players yet. Tap "+ New Player" above to add the first one.
          </Text>
        )}

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
            setExtraLabel('');
            setExtraAmt('');
          }}
        />
      </Card>

      <Card>
        <Text style={styles.title}>Summary</Text>
        <Text>Total: ₹{total.toFixed(0)}</Text>
        <Text>Per Player: ₹{share.toFixed(0)}</Text>
      </Card>

      <Button title="Create Game" onPress={save} disabled={selected.length === 0} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: '700', marginBottom: 8, fontSize: 16 },
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
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0d6efd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxOn: { backgroundColor: '#0d6efd' },
});
import React, { useState, useMemo } from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet, Linking } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStack } from '../../App';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Field from '../components/Field';
import Button from '../components/Button';
import { playerSummaries } from '../utils/calculations';
import { uid } from '../db/database';

export default function PlayersScreen({ navigation }: NativeStackScreenProps<RootStack, 'Players'>) {
  const { state, addPlayer } = useApp();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showForm, setShowForm] = useState(true); // open by default

  const summaries = useMemo(() => playerSummaries(state), [state]);
  const recent = useMemo(
    () => [...summaries].sort((a, b) => (b.lastPlayed || '').localeCompare(a.lastPlayed || '')),
    [summaries],
  );

  const save = async () => {
    if (!name.trim()) return;
    await addPlayer({
      id: uid(),
      name: name.trim(),
      phone: phone.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    setName('');
    setPhone('');
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, maxWidth: 900, alignSelf: 'center', width: '100%' }}
      keyboardShouldPersistTaps="handled">
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontWeight: '700', fontSize: 16 }}>Add New Player</Text>
          <Button
            title={showForm ? 'Hide' : '+ Add'}
            variant="ghost"
            onPress={() => setShowForm(v => !v)}
            style={{ paddingVertical: 6, paddingHorizontal: 12 }}
          />
        </View>
        {showForm && (
          <View style={{ marginTop: 12 }}>
            <Field label="Name" value={name} onChangeText={setName} placeholder="Player name" />
            <Field
              label="Phone (optional)"
              value={phone}
              onChangeText={setPhone}
              placeholder="+91..."
              keyboardType="phone-pad"
            />
            <Button title="Save Player" onPress={save} disabled={!name.trim()} />
          </View>
        )}
      </Card>

      <Text style={styles.h2}>All Players ({summaries.length})</Text>
      {summaries.length === 0 && (
        <Card>
          <Text style={{ color: '#666' }}>
            No players yet. Add one above to start creating games.
          </Text>
        </Card>
      )}
      {recent.map(({ player: p, balance, lastPlayed, gamesPlayed }) => (
        <Card key={p.id} style={{ paddingVertical: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              style={{ flex: 1 }}
              onPress={() => navigation.navigate('PlayerDetail', { id: p.id })}>
              <Text style={{ fontWeight: '700', fontSize: 16 }}>
                {p.name}
                {p.id === state.myPlayerId ? ' (Me)' : ''}
              </Text>
              <Text style={{ color: '#666', fontSize: 12 }}>
                {gamesPlayed} games • Last:{' '}
                {lastPlayed ? new Date(lastPlayed).toLocaleDateString() : '—'}
              </Text>
              {p.phone ? (
                <Pressable onPress={() => Linking.openURL(`tel:${p.phone}`)}>
                  <Text style={{ color: '#0d6efd', fontSize: 12, marginTop: 2 }}>
                    📞 {p.phone}
                  </Text>
                </Pressable>
              ) : null}
            </Pressable>
            <View style={{ alignItems: 'flex-end', minWidth: 90 }}>
              <Text
                style={{
                  fontWeight: '800',
                  fontSize: 16,
                  color: balance >= 0 ? '#0f5132' : '#842029',
                }}>
                {balance >= 0 ? '+' : '-'}₹{Math.abs(balance).toFixed(0)}
              </Text>
              <Text style={{ fontSize: 11, color: '#666' }}>
                {balance >= 0 ? 'Credit' : 'Debit'}
              </Text>
              <Pressable
                onPress={() => navigation.navigate('PlayerDetail', { id: p.id })}
                style={{
                  marginTop: 6,
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 8,
                  backgroundColor: '#eef4ff',
                }}>
                <Text style={{ color: '#0d6efd', fontWeight: '600', fontSize: 12 }}>
                  Games ›
                </Text>
              </Pressable>
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  h2: { fontWeight: '700', fontSize: 18, marginTop: 8, marginBottom: 8 },
});
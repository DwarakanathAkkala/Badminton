import React, { useState } from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStack } from '../../App';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Field from '../components/Field';
import Button from '../components/Button';
import { playerBalance } from '../utils/calculations';

export default function PlayersScreen({ navigation }: NativeStackScreenProps<RootStack, 'Players'>) {
  const { state, addPlayer } = useApp();
  const [name, setName] = useState('');

  return (
    <ScrollView contentContainerStyle={{ padding: 16, maxWidth: 900, alignSelf: 'center', width: '100%' }}>
      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 8 }}>Add Player</Text>
        <Field label="Name" value={name} onChangeText={setName} placeholder="Player name" />
        <Button
          title="Add"
          onPress={() => {
            if (!name.trim()) return;
            addPlayer({ id: Math.random().toString(36).slice(2, 10), name: name.trim() });
            setName('');
          }}
        />
      </Card>

      <Text style={{ fontWeight: '700', fontSize: 18, marginBottom: 8 }}>All Players</Text>
      {state.players.map(p => {
        const bal = playerBalance(state, p.id);
        return (
          <Pressable key={p.id} onPress={() => navigation.navigate('PlayerDetail', { id: p.id })}>
            <Card style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700' }}>{p.name}{p.id === state.myPlayerId ? ' (Me)' : ''}</Text>
                <Text style={{ color: '#666', fontSize: 12 }}>
                  {bal >= 0 ? 'Credit' : 'Debit'}: ₹{Math.abs(bal).toFixed(0)}
                </Text>
              </View>
              <View style={styles.btn}>
                <Text style={{ color: '#0d6efd', fontWeight: '600' }}>Games ›</Text>
              </View>
            </Card>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#eef4ff' },
});
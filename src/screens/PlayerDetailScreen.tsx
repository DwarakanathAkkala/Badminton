import React from 'react';
import { ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStack } from '../../App';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import { playerBalance, playerGames, perPlayerShare, amountPaid } from '../utils/calculations';

export default function PlayerDetailScreen({ route, navigation }: NativeStackScreenProps<RootStack, 'PlayerDetail'>) {
  const { state } = useApp();
  const player = state.players.find(p => p.id === route.params.id);
  if (!player) return <Text style={{ padding: 20 }}>Player not found</Text>;
  const games = playerGames(state, player.id);
  const balance = playerBalance(state, player.id);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, maxWidth: 900, alignSelf: 'center', width: '100%' }}>
      <Card>
        <Text style={{ fontWeight: '700', fontSize: 20 }}>{player.name}</Text>
        <Text style={{ marginTop: 4, color: balance >= 0 ? 'green' : '#a00' }}>
          {balance >= 0 ? 'Total Credit' : 'Total Debit'}: ₹{Math.abs(balance).toFixed(0)}
        </Text>
      </Card>

      <Text style={{ fontWeight: '700', fontSize: 18, marginVertical: 8 }}>Games ({games.length})</Text>
      {games.length === 0 && <Card><Text>No games yet.</Text></Card>}
      {games.map(g => (
        <Pressable key={g.id} onPress={() => navigation.navigate('GameDetail', { id: g.id })}>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontWeight: '700' }}>{new Date(g.date).toDateString()}</Text>
              <Text style={{ color: g.completed ? '#0f5132' : '#664d03' }}>
                {g.completed ? 'Completed' : 'Pending'}
              </Text>
            </View>
            <Text style={{ color: '#555', marginTop: 4 }}>{g.venue}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
              <Text>Share: ₹{perPlayerShare(g).toFixed(0)}</Text>
              <Text>Paid: ₹{amountPaid(g, player.id).toFixed(0)}</Text>
            </View>
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}
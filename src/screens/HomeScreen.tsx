import React from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { gameTotalCost, perPlayerShare, playerBalance } from '../utils/calculations';
import { RootStack } from '../../App';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export default function HomeScreen({ navigation }: NativeStackScreenProps<RootStack, 'Home'>) {
  const { state } = useApp();
  const games = [...state.games].sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <ScrollView contentContainerStyle={{ padding: 16, maxWidth: 900, alignSelf: 'center', width: '100%' }}>
      <View style={styles.quickRow}>
        <Button title="+ New Game" onPress={() => navigation.navigate('NewGame')} style={{ flex: 1 }} />
        <View style={{ width: 8 }} />
        <Button title="Dashboard" variant="ghost" onPress={() => navigation.navigate('Dashboard')} style={{ flex: 1 }} />
      </View>
      <View style={[styles.quickRow, { marginTop: 8 }]}>
        <Button title="Players" variant="ghost" onPress={() => navigation.navigate('Players')} style={{ flex: 1 }} />
        <View style={{ width: 8 }} />
        <Button title="Shuttles" variant="ghost" onPress={() => navigation.navigate('Shuttles')} style={{ flex: 1 }} />
        <View style={{ width: 8 }} />
        <Button title="Expenses" variant="ghost" onPress={() => navigation.navigate('Expenses')} style={{ flex: 1 }} />
      </View>

      <Text style={styles.h1}>Past Games</Text>
      {games.length === 0 && <Card><Text>No games yet. Tap "+ New Game" to start.</Text></Card>}
      {games.map(g => {
        const players = g.playerIds
          .map(id => state.players.find(p => p.id === id)?.name || '?')
          .join(', ');
        return (
          <Pressable key={g.id} onPress={() => navigation.navigate('GameDetail', { id: g.id })}>
            <Card>
              <View style={styles.rowBetween}>
                <Text style={styles.gameDate}>{new Date(g.date).toLocaleDateString()}</Text>
                <Text style={[styles.badge, g.completed ? styles.badgeOk : styles.badgePending]}>
                  {g.completed ? 'Completed' : 'Pending'}
                </Text>
              </View>
              <Text style={{ color: '#555', marginTop: 4 }}>{g.venue}</Text>
              <Text style={{ marginTop: 6, color: '#333' }}>{players}</Text>
              <View style={[styles.rowBetween, { marginTop: 8 }]}>
                <Text style={{ color: '#666' }}>Total: ₹{gameTotalCost(g).toFixed(0)}</Text>
                <Text style={{ color: '#666' }}>Each: ₹{perPlayerShare(g).toFixed(0)}</Text>
              </View>
            </Card>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  quickRow: { flexDirection: 'row', marginBottom: 8 },
  h1: { fontSize: 20, fontWeight: '700', marginVertical: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gameDate: { fontWeight: '700', fontSize: 16 },
  badge: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, overflow: 'hidden' },
  badgeOk: { backgroundColor: '#d1e7dd', color: '#0f5132' },
  badgePending: { backgroundColor: '#fff3cd', color: '#664d03' },
});
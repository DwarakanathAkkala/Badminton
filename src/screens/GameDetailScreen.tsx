import React from 'react';
import { ScrollView, Text, View, StyleSheet, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStack } from '../../App';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { gameTotalCost, perPlayerShare, durationLabel } from '../utils/calculations';

export default function GameDetailScreen({
  route,
  navigation,
}: NativeStackScreenProps<RootStack, 'GameDetail'>) {
  const { state, markCompleted, markShuttleBroken, setPayment } = useApp();
  const game = state.games.find(g => g.id === route.params.id);
  if (!game) return <Text style={{ padding: 20 }}>Game not found</Text>;

  const total = gameTotalCost(game);
  const share = perPlayerShare(game);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, maxWidth: 900, alignSelf: 'center', width: '100%' }}>
      <Card>
        <Text style={styles.title}>
          {new Date(game.date).toLocaleDateString()} •{' '}
          {new Date(game.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        <Text style={{ color: '#555' }}>
          {game.courtName} • {game.numCourts} court(s) • {durationLabel(game.durationMinutes)}
        </Text>
        <View style={{ marginTop: 8 }}>
          <Row label="Court" value={`₹${game.courtCost}`} />
          <Row
            label={`Shuttle Amount (used ${game.shuttlesUsed})`}
            value={`₹${game.shuttleAmountCollected}`}
          />
          {game.extraExpenses.map(e => (
            <Row key={e.id} label={e.label} value={`₹${e.amount}`} />
          ))}
          <Row label="Total" value={`₹${total.toFixed(0)}`} bold />
          <Row label="Per Player" value={`₹${share.toFixed(0)}`} bold />
        </View>
      </Card>

      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={styles.title}>Shuttle Broken</Text>
          <Pressable
            onPress={() => { void markShuttleBroken(game.id, game.shuttlePackId); }}
            style={[styles.checkbox, game.shuttleBroken && styles.checkboxOn]}>
            {game.shuttleBroken && <Text style={{ color: '#fff', fontWeight: '900' }}>✓</Text>}
          </Pressable>
        </View>
        <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
          Toggling ON will decrement the linked pack's remaining shuttle count by 1.
        </Text>
      </Card>

      <Card>
        <Text style={styles.title}>Players ({game.playerIds.length})</Text>
        {game.playerIds.map(id => {
          const p = state.players.find(x => x.id === id);
          const pay = game.payments.find(x => x.playerId === id);
          const paid = !!pay?.paid;
          return (
            <View key={id} style={styles.pRow}>
              <Pressable
                style={{ flex: 1 }}
                onPress={() => navigation.navigate('PlayerDetail', { id })}>
                <Text style={{ fontWeight: '600', color: '#0d6efd' }}>
                  {p?.name}
                  {id === game.hostId ? ' (host)' : ''}
                </Text>
                <Text style={{ color: paid ? 'green' : '#a00', fontSize: 12 }}>
                  {paid ? `Paid ₹${pay?.amount ?? 0}` : 'Unpaid'}
                </Text>
              </Pressable>
              <Button
                title={paid ? 'Undo' : `Mark ₹${share.toFixed(0)}`}
                variant={paid ? 'ghost' : 'primary'}
                onPress={() => { void setPayment(game.id, id, paid ? 0 : share, !paid); }}
                style={{ paddingVertical: 6, paddingHorizontal: 10 }}
              />
            </View>
          );
        })}
      </Card>

      <Button
        title={game.completed ? 'Mark as Pending' : 'Mark Completed'}
        onPress={() => { void markCompleted(game.id, !game.completed); }}
      />
      <View style={{ height: 8 }} />
      <Button title="Back to Games" variant="ghost" onPress={() => navigation.goBack()} />
    </ScrollView>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 3 }}>
      <Text style={{ fontWeight: bold ? '700' : '400' }}>{label}</Text>
      <Text style={{ fontWeight: bold ? '700' : '400' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: '700', fontSize: 18, marginBottom: 4 },
  pRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#0d6efd',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxOn: { backgroundColor: '#0d6efd' },
});
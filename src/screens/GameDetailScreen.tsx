import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStack } from '../../App';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Button from '../components/Button';
import Field from '../components/Field';
import { gameTotalCost, perPlayerShare } from '../utils/calculations';

export default function GameDetailScreen({ route, navigation }: NativeStackScreenProps<RootStack, 'GameDetail'>) {
  const { state, updateGame } = useApp();
  const game = state.games.find(g => g.id === route.params.id);
  if (!game) return <Text style={{ padding: 20 }}>Game not found</Text>;

  const total = gameTotalCost(game);
  const share = perPlayerShare(game);

  const setPaid = (playerId: string, paid: boolean) => {
    const payments = game.payments.map(p =>
      p.playerId === playerId ? { ...p, paid, amount: paid ? share : 0 } : p,
    );
    // If some player not present in payments, add
    if (!payments.find(p => p.playerId === playerId)) {
      payments.push({ playerId, paid, amount: paid ? share : 0 });
    }
    updateGame(game.id, { payments });
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, maxWidth: 900, alignSelf: 'center', width: '100%' }}>
      <Card>
        <Text style={styles.title}>{new Date(game.date).toDateString()}</Text>
        <Text style={{ color: '#555' }}>{game.venue}</Text>
        <View style={{ marginTop: 8 }}>
          <Row label="Court" value={`₹${game.courtCost}`} />
          <Row label={`Shuttles (${game.shuttlesUsed})`} value={`₹${(game.shuttlesUsed * game.shuttleUnitCost).toFixed(0)}`} />
          {game.extraExpenses.map(e => <Row key={e.id} label={e.label} value={`₹${e.amount}`} />)}
          <Row label="Total" value={`₹${total.toFixed(0)}`} bold />
          <Row label="Per Player" value={`₹${share.toFixed(0)}`} bold />
        </View>
      </Card>

      <Card>
        <Text style={styles.title}>Players ({game.playerIds.length})</Text>
        {game.playerIds.map(id => {
          const p = state.players.find(x => x.id === id);
          const pay = game.payments.find(x => x.playerId === id);
          const paid = !!pay?.paid;
          return (
            <View key={id} style={styles.pRow}>
              <Text style={{ flex: 1, fontWeight: '600' }}>{p?.name}{id === game.hostId ? ' (host)' : ''}</Text>
              <Text style={{ marginRight: 8, color: paid ? 'green' : '#a00' }}>
                {paid ? `Paid ₹${pay?.amount ?? 0}` : 'Unpaid'}
              </Text>
              <Button
                title={paid ? 'Undo' : 'Mark Paid'}
                variant={paid ? 'ghost' : 'primary'}
                onPress={() => setPaid(id, !paid)}
                style={{ paddingVertical: 6, paddingHorizontal: 10 }}
              />
            </View>
          );
        })}
      </Card>

      <Button
        title={game.completed ? 'Mark as Pending' : 'Mark Completed'}
        onPress={() => updateGame(game.id, { completed: !game.completed })}
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
  pRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' },
});
import React from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import { myStats } from '../utils/calculations';

export default function DashboardScreen() {
  const { state } = useApp();
  const s = myStats(state);
  const net = s.profitLoss;
  return (
    <ScrollView contentContainerStyle={{ padding: 16, maxWidth: 900, alignSelf: 'center', width: '100%' }}>
      <Card>
        <Text style={styles.title}>My Share Summary</Text>
        <Row label="Games Played" value={`${s.myGames}`} />
        <Row label="Total Game Cost" value={`₹${s.totalGameCost.toFixed(0)}`} />
        <Row label="My Share (total)" value={`₹${s.myShares.toFixed(0)}`} />
        <Row label="My Payments" value={`₹${s.myPayments.toFixed(0)}`} />
        <Row label="Total Collected (all)" value={`₹${s.totalCollected.toFixed(0)}`} />
      </Card>

      <Card>
        <Text style={styles.title}>Profit / Loss (after my share)</Text>
        <Text
          style={{
            fontSize: 30,
            fontWeight: '800',
            color: net >= 0 ? '#0f5132' : '#842029',
            textAlign: 'center',
          }}>
          {net >= 0 ? '+' : '-'}₹{Math.abs(net).toFixed(0)}
        </Text>
        <Text style={{ textAlign: 'center', color: '#555', marginTop: 6 }}>
          {net >= 0 ? 'You are in credit' : 'You are in debit'}
        </Text>
      </Card>

      <Card>
        <Text style={styles.title}>Calculation Logic</Text>
        <Text style={{ color: '#444', lineHeight: 20 }}>
          Profit/Loss = (Amounts you paid) − (Your equal share of every completed game).{'\n'}
          Each game cost = Court cost + Shuttle amount collected + Extra expenses.
        </Text>
      </Card>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 }}>
      <Text>{label}</Text>
      <Text style={{ fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontWeight: '700', fontSize: 16, marginBottom: 8 },
});
import React, { useState } from 'react';
import { ScrollView, Text, View, StyleSheet } from 'react-native';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Field from '../components/Field';
import Button from '../components/Button';

const uid = () => Math.random().toString(36).slice(2, 10);

export default function ShuttlesScreen() {
  const { state, addShuttlePack } = useApp();
  const [code, setCode] = useState('');
  const [brand, setBrand] = useState('Yonex');
  const [count, setCount] = useState('6');
  const [cost, setCost] = useState('720');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <ScrollView contentContainerStyle={{ padding: 16, maxWidth: 900, alignSelf: 'center', width: '100%' }}>
      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 8 }}>New Shuttle Pack</Text>
        <Field label="Code" value={code} onChangeText={setCode} placeholder="e.g. YL-2025-01" />
        <Field label="Brand" value={brand} onChangeText={setBrand} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}><Field label="Count" value={count} onChangeText={setCount} keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Field label="Total Cost (₹)" value={cost} onChangeText={setCost} keyboardType="numeric" /></View>
        </View>
        <Field label="Start Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
        <Button
          title="Add Pack"
          onPress={() => {
            if (!code) return;
            addShuttlePack({
              id: uid(), code, brand,
              count: Number(count || 6),
              totalCost: Number(cost || 0),
              startDate: new Date(date).toISOString(),
              remaining: Number(count || 6),
            });
            setCode('');
          }}
        />
      </Card>

      <Text style={{ fontWeight: '700', fontSize: 18, marginVertical: 8 }}>Packs</Text>
      {state.shuttlePacks.length === 0 && <Card><Text>No packs added.</Text></Card>}
      {state.shuttlePacks.map(p => (
        <Card key={p.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '700' }}>{p.code}</Text>
            <Text style={{ color: '#555' }}>{p.brand}</Text>
          </View>
          <Text style={{ marginTop: 4 }}>Start: {new Date(p.startDate).toDateString()}</Text>
          <Text>Cost: ₹{p.totalCost} | Per shuttle: ₹{(p.totalCost / p.count).toFixed(1)}</Text>
          <Text>Remaining: {p.remaining} / {p.count}</Text>
        </Card>
      ))}
    </ScrollView>
  );
}
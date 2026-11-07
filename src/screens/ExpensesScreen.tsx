import React, { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import Field from '../components/Field';
import Button from '../components/Button';
import { Expense } from '../types';
import { uid } from '../db/database';

export default function ExpensesScreen() {
  const { state, addExpense } = useApp();
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  return (
    <ScrollView contentContainerStyle={{ padding: 16, maxWidth: 900, alignSelf: 'center', width: '100%' }}>
      <Card>
        <Text style={{ fontWeight: '700', marginBottom: 8 }}>Add Expense</Text>
        <Field label="Label" value={label} onChangeText={setLabel} placeholder="e.g. Membership" />
        <Field label="Amount (₹)" value={amount} onChangeText={setAmount} keyboardType="numeric" />
        <Field label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
        <Button
          title="Add Expense"
          onPress={async () => {
            if (!label || !amount) return;
            const e: Expense = {
              id: uid(),
              label,
              amount: Number(amount),
              date: new Date(date).toISOString(),
              category: 'other',
            };
            await addExpense(e);
            setLabel('');
            setAmount('');
          }}
        />
      </Card>

      <Text style={{ fontWeight: '700', fontSize: 18, marginVertical: 8 }}>Expenses</Text>
      {state.expenses.length === 0 && (
        <Card>
          <Text>No expenses yet.</Text>
        </Card>
      )}
      {state.expenses.map(e => (
        <Card key={e.id}>
          <Text style={{ fontWeight: '700' }}>{e.label}</Text>
          <Text style={{ color: '#555' }}>
            ₹{e.amount} • {new Date(e.date).toDateString()}
          </Text>
        </Card>
      ))}
    </ScrollView>
  );
}
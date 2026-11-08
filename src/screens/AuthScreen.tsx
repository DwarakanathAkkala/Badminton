import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  async function signUp() {
  setLoading(true);
  const { data: { session }, error } = await supabase.auth.signUp({ email, password });
  if (error) Alert.alert(error.message);
  // After disabling email confirmation, session will have a value, and the user can enter the app directly
  setLoading(false);
}

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Badminton Splitter</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={signIn} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Loading...' : 'Sign In'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.ghost]} onPress={signUp} disabled={loading}>
        <Text style={[styles.buttonText, styles.ghostText]}>Sign Up</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 32 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 10,
    padding: 12, fontSize: 16, marginBottom: 12, backgroundColor: '#fafafa',
  },
  button: {
    backgroundColor: '#0d6efd', padding: 14, borderRadius: 10,
    alignItems: 'center', marginTop: 8,
  },
  ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#0d6efd' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  ghostText: { color: '#0d6efd' },
});
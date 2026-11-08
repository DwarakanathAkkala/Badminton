import { configureSupastash, defineLocalSchema } from 'supastash';
import { supabase } from './supabase';
import { openDatabaseAsync } from 'expo-sqlite';
import * as NetInfo from '@react-native-community/netinfo';

configureSupastash({
  supabaseClient: supabase,
  dbName: 'Badminton',
  sqliteClient: { openDatabaseAsync },
  sqliteClientType: 'expo',
  networkAdapter: NetInfo,

  // ✅ Must be async to satisfy TypeScript
  onSchemaInit: async () => {
    // ---------- PLAYERS ----------
    defineLocalSchema('players', {
      id: 'TEXT PRIMARY KEY',
      user_id: 'TEXT NOT NULL',
      name: 'TEXT NOT NULL',
      phone: 'TEXT',
      is_host: 'INTEGER DEFAULT 0',
    });

    // ---------- GAMES ----------
    defineLocalSchema('games', {
      id: 'TEXT PRIMARY KEY',
      user_id: 'TEXT NOT NULL',
      date: 'TEXT NOT NULL',
      court_name: 'TEXT',
      num_courts: 'INTEGER',
      duration_minutes: 'INTEGER',
      host_id: 'TEXT',
      court_cost: 'REAL',
      shuttles_used: 'INTEGER',
      shuttle_amount_collected: 'REAL',
      shuttle_pack_id: 'TEXT',
      shuttle_broken: 'INTEGER DEFAULT 0',
      notes: 'TEXT',
      completed: 'INTEGER DEFAULT 0',
    });

    // ---------- PAYMENTS ----------
    defineLocalSchema('payments', {
      id: 'TEXT PRIMARY KEY',
      user_id: 'TEXT NOT NULL',
      game_id: 'TEXT NOT NULL',
      player_id: 'TEXT NOT NULL',
      amount: 'REAL DEFAULT 0',
      paid: 'INTEGER DEFAULT 0',
    });

    // ---------- EXTRA EXPENSES ----------
    defineLocalSchema('extra_expenses', {
      id: 'TEXT PRIMARY KEY',
      user_id: 'TEXT NOT NULL',
      game_id: 'TEXT NOT NULL',
      label: 'TEXT',
      amount: 'REAL DEFAULT 0',
    });

    // ---------- SHUTTLE PACKS ----------
    defineLocalSchema('shuttle_packs', {
      id: 'TEXT PRIMARY KEY',
      user_id: 'TEXT NOT NULL',
      code: 'TEXT NOT NULL',
      brand: 'TEXT',
      count: 'INTEGER',
      total_cost: 'REAL',
      start_date: 'TEXT',
      remaining: 'INTEGER',
    });

    // ---------- EXPENSES ----------
    defineLocalSchema('expenses', {
      id: 'TEXT PRIMARY KEY',
      user_id: 'TEXT NOT NULL',
      date: 'TEXT',
      label: 'TEXT',
      amount: 'REAL DEFAULT 0',
      category: 'TEXT',
      game_id: 'TEXT',
    });
  },

  syncEngine: {
    push: true,
    pull: true,
  },
});

export const syncFilters = {
  players: [{ column: 'user_id', operator: 'eq' as const, value: '' }],
  games: [{ column: 'user_id', operator: 'eq' as const, value: '' }],
  payments: [{ column: 'user_id', operator: 'eq' as const, value: '' }],
  extra_expenses: [{ column: 'user_id', operator: 'eq' as const, value: '' }],
  shuttle_packs: [{ column: 'user_id', operator: 'eq' as const, value: '' }],
  expenses: [{ column: 'user_id', operator: 'eq' as const, value: '' }],
};

export {};
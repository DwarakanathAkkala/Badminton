import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSupastashFilters } from 'supastash';
import { AppState, Game, Player, ShuttlePack, Expense } from '../types';
import {
  fetchGames, fetchPlayers, fetchShuttlePacks, fetchExpenses,
  insertGame, insertPlayer, insertShuttlePack, insertExpense,
  updatePlayer as dbUpdatePlayer, updateGameFlag, updatePayment, decrementShuttle,
} from '../db/database';

const MY_PLAYER_ID_KEY = 'badminton_my_player_id';

type Ctx = {
  state: AppState;
  ready: boolean;
  setMyPlayer: (id: string) => Promise<void>;
  addPlayer: (p: Player) => Promise<void>;
  updatePlayer: (id: string, patch: Partial<Player>) => Promise<void>;
  addGame: (g: Game) => Promise<void>;
  markCompleted: (id: string, completed: boolean) => Promise<void>;
  markShuttleBroken: (id: string, packId?: string) => Promise<void>;
  setPayment: (gameId: string, playerId: string, amount: number, paid: boolean) => Promise<void>;
  addShuttlePack: (p: ShuttlePack) => Promise<void>;
  addExpense: (e: Expense) => Promise<void>;
  refresh: () => Promise<void>;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const [state, setState] = useState<AppState>({
    players: [], games: [], shuttlePacks: [], expenses: [], myPlayerId: '',
  });
  const [ready, setReady] = useState(false);

  useSupastashFilters({
    players: [{ column: 'user_id', operator: 'eq', value: userId }],
    games: [{ column: 'user_id', operator: 'eq', value: userId }],
    payments: [{ column: 'user_id', operator: 'eq', value: userId }],
    extra_expenses: [{ column: 'user_id', operator: 'eq', value: userId }],
    shuttle_packs: [{ column: 'user_id', operator: 'eq', value: userId }],
    expenses: [{ column: 'user_id', operator: 'eq', value: userId }],
  });

  const refresh = useCallback(async () => {
    const [players, games, shuttlePacks, expenses, storedMyId] = await Promise.all([
      fetchPlayers(), fetchGames(), fetchShuttlePacks(), fetchExpenses(), AsyncStorage.getItem(MY_PLAYER_ID_KEY),
    ]);
    const myPlayerId = storedMyId || players.find(p => p.isHost)?.id || players[0]?.id || '';
    setState({ players, games, shuttlePacks, expenses, myPlayerId });
  }, []);

  useEffect(() => {
    (async () => {
      await refresh();
      setReady(true);
    })();
  }, [refresh]);

  const api = useMemo<Ctx>(() => ({
    state, ready,
    setMyPlayer: async (id: string) => {
      await AsyncStorage.setItem(MY_PLAYER_ID_KEY, id);
      setState(s => ({ ...s, myPlayerId: id }));
    },
    addPlayer: async (p: Player) => {
      await insertPlayer(p, userId); // ✅ Passed userId
      await refresh();
    },
    updatePlayer: async (id: string, patch: Partial<Player>) => {
      await dbUpdatePlayer(id, patch);
      await refresh();
    },
    addGame: async (g: Game) => {
      await insertGame(g, userId); // ✅ Passed userId
      if (g.shuttleBroken && g.shuttlePackId) {
        await decrementShuttle(g.shuttlePackId);
      }
      await refresh();
    },
    markCompleted: async (id: string, completed: boolean) => {
      await updateGameFlag(id, { completed });
      await refresh();
    },
    markShuttleBroken: async (id: string, packId?: string) => {
      const game = state.games.find(g => g.id === id);
      const wasBroken = !!game?.shuttleBroken;
      await updateGameFlag(id, { shuttleBroken: !wasBroken });
      const targetPack = packId || game?.shuttlePackId;
      if (!wasBroken && targetPack) await decrementShuttle(targetPack);
      await refresh();
    },
    setPayment: async (gameId, playerId, amount, paid) => {
      await updatePayment(gameId, playerId, amount, paid, userId); // ✅ Passed userId
      await refresh();
    },
    addShuttlePack: async (p: ShuttlePack) => {
      await insertShuttlePack(p, userId); // ✅ Passed userId
      await refresh();
    },
    addExpense: async (e: Expense) => {
      await insertExpense(e, userId); // ✅ Passed userId
      await refresh();
    },
    refresh,
  }), [state, ready, refresh, userId]);

  if (!ready) return null;
  return <AppCtx.Provider value={api}>{children}</AppCtx.Provider>;
}

export function useApp(): Ctx {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp outside provider');
  return c;
}
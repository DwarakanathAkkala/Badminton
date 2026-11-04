import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState, Game, Player, ShuttlePack, Expense } from '../types';
import { loadState, saveState, DEFAULT_STATE } from '../storage/storage';

type Ctx = {
  state: AppState;
  addGame: (g: Game) => void;
  updateGame: (id: string, patch: Partial<Game>) => void;
  addPlayer: (p: Player) => void;
  addShuttlePack: (s: ShuttlePack) => void;
  addExpense: (e: Expense) => void;
  setMyPlayer: (id: string) => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadState().then(s => { setState(s); setReady(true); });
  }, []);

  useEffect(() => {
    if (ready) saveState(state);
  }, [state, ready]);

  const api = useMemo<Ctx>(() => ({
    state,
    addGame: g => setState(s => ({ ...s, games: [g, ...s.games] })),
    updateGame: (id, patch) =>
      setState(s => ({ ...s, games: s.games.map(g => (g.id === id ? { ...g, ...patch } : g)) })),
    addPlayer: p => setState(s => ({ ...s, players: [...s.players, p] })),
    addShuttlePack: sp => setState(s => ({ ...s, shuttlePacks: [sp, ...s.shuttlePacks] })),
    addExpense: e => setState(s => ({ ...s, expenses: [e, ...s.expenses] })),
    setMyPlayer: id => setState(s => ({ ...s, myPlayerId: id })),
  }), [state, ready]);

  if (!ready) return null;
  return <AppCtx.Provider value={api}>{children}</AppCtx.Provider>;
}

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp outside provider');
  return c;
}
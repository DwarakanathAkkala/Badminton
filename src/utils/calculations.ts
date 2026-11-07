import { AppState, Game, PlayerSummary } from '../types';

export function gameTotalCost(g: Game): number {
  const extras = g.extraExpenses.reduce((s, e) => s + e.amount, 0);
  return g.courtCost + g.shuttleAmountCollected + extras;
}

export function perPlayerShare(g: Game): number {
  if (g.playerIds.length === 0) return 0;
  return gameTotalCost(g) / g.playerIds.length;
}

export function amountPaid(g: Game, playerId: string): number {
  const p = g.payments.find(x => x.playerId === playerId);
  return p && p.paid ? p.amount : 0;
}

export function playerBalance(state: AppState, playerId: string): number {
  let balance = 0;
  for (const g of state.games) {
    if (!g.completed) continue;
    if (!g.playerIds.includes(playerId)) continue;
    balance += amountPaid(g, playerId) - perPlayerShare(g);
  }
  return balance;
}

export function playerSummaries(state: AppState): PlayerSummary[] {
  return state.players.map(p => {
    const games = state.games.filter(g => g.playerIds.includes(p.id));
    let lastPlayed: string | null = null;
    for (const g of games) {
      if (!lastPlayed || g.date > lastPlayed) lastPlayed = g.date;
    }
    return {
      player: p,
      balance: playerBalance(state, p.id),
      lastPlayed,
      gamesPlayed: games.length,
    };
  });
}

export function myStats(state: AppState) {
  const me = state.myPlayerId;
  const myGames = state.games.filter(g => g.completed && g.playerIds.includes(me));
  const totalCollected = state.games.reduce(
    (s, g) => s + g.payments.filter(p => p.paid).reduce((a, b) => a + b.amount, 0),
    0,
  );
  const myShares = myGames.reduce((s, g) => s + perPlayerShare(g), 0);
  const myPayments = state.games.reduce((s, g) => s + amountPaid(g, me), 0);
  const totalGameCost = myGames.reduce((s, g) => s + gameTotalCost(g), 0);
  const profitLoss = myPayments - myShares;
  return {
    myGames: myGames.length,
    totalCollected,
    myShares,
    myPayments,
    totalGameCost,
    profitLoss,
  };
}

export function playerGames(state: AppState, playerId: string): Game[] {
  return state.games
    .filter(g => g.playerIds.includes(playerId))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function durationLabel(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} Hr`;
  return `${h} Hr ${m} min`;
}

export const DURATION_OPTIONS: number[] = [60, 90, 120, 150, 180];
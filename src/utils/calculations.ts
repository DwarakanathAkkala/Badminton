import { AppState, Game, Player } from '../types';

export function gameTotalCost(g: Game): number {
  const extras = g.extraExpenses.reduce((s, e) => s + e.amount, 0);
  return g.courtCost + g.shuttlesUsed * g.shuttleUnitCost + extras;
}

export function perPlayerShare(g: Game): number {
  if (g.playerIds.length === 0) return 0;
  return gameTotalCost(g) / g.playerIds.length;
}

export function amountPaid(g: Game, playerId: string): number {
  const p = g.payments.find(x => x.playerId === playerId);
  return p && p.paid ? p.amount : 0;
}

// Net balance: positive => others owe player (credit); negative => player owes
export function playerBalance(state: AppState, playerId: string): number {
  let balance = 0;
  for (const g of state.games) {
    if (!g.completed) continue;
    if (!g.playerIds.includes(playerId)) continue;
    const share = perPlayerShare(g);
    const paid = amountPaid(g, playerId);
    balance += paid - share;
  }
  return balance;
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
  const myExpenseShare = state.expenses.reduce((s, e) => s + e.amount, 0); // for info
  return {
    myGames: myGames.length,
    totalCollected,
    myShares,
    myPayments,
    totalGameCost,
    profitLoss,
    myExpenseShare,
  };
}

export function playerGames(state: AppState, playerId: string): Game[] {
  return state.games
    .filter(g => g.playerIds.includes(playerId))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
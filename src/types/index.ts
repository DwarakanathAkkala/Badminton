export type Player = {
  id: string;
  name: string;
  phone?: string;
  isHost?: boolean;
  createdAt: string;
};

export type PlayerPayment = {
  playerId: string;
  amount: number;
  paid: boolean;
};

export type ExtraExpense = { id: string; label: string; amount: number };

export type Game = {
  id: string;
  date: string;
  courtName: string;
  numCourts: number;
  durationMinutes: number;
  playerIds: string[];
  hostId: string;
  courtCost: number;
  shuttlesUsed: number;
  shuttleAmountCollected: number;
  extraExpenses: ExtraExpense[];
  payments: PlayerPayment[];
  shuttlePackId?: string;
  shuttleBroken: boolean;
  notes?: string;
  completed: boolean;
  createdAt: string;
};

export type ShuttlePack = {
  id: string;
  code: string;
  brand: string;
  count: number;
  totalCost: number;
  startDate: string;
  remaining: number;
};

export type Expense = {
  id: string;
  date: string;
  label: string;
  amount: number;
  category: 'shuttle' | 'court' | 'other';
  gameId?: string;
};

export type AppState = {
  players: Player[];
  games: Game[];
  shuttlePacks: ShuttlePack[];
  expenses: Expense[];
  myPlayerId: string;
};

export type PlayerSummary = {
  player: Player;
  balance: number;
  lastPlayed: string | null;
  gamesPlayed: number;
};
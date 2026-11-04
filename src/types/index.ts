export type Player = {
  id: string;
  name: string;
  phone?: string;
  isHost?: boolean;
};

export type PlayerPayment = {
  playerId: string;
  amount: number;
  paid: boolean;
  method?: 'cash' | 'upi' | 'other';
};

export type Game = {
  id: string;
  date: string; // ISO
  venue: string;
  playerIds: string[];
  hostId: string;
  courtCost: number;
  shuttlesUsed: number;
  // shuttle cost per shuttle computed from pack
  shuttlePackId?: string;
  shuttleUnitCost: number;
  extraExpenses: { id: string; label: string; amount: number }[];
  payments: PlayerPayment[];
  notes?: string;
  completed: boolean;
};

export type ShuttlePack = {
  id: string;
  code: string; // e.g. "YL-2024-01"
  brand: string;
  count: number; // usually 6
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
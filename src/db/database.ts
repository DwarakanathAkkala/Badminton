import * as SQLite from 'expo-sqlite';
import { Game, Player, ShuttlePack, Expense } from '../types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('badminton.db');
  await dbInstance.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      isHost INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      courtName TEXT,
      numCourts INTEGER,
      durationMinutes INTEGER,
      hostId TEXT,
      courtCost REAL,
      shuttlesUsed INTEGER,
      shuttleAmountCollected REAL,
      shuttlePackId TEXT,
      shuttleBroken INTEGER DEFAULT 0,
      notes TEXT,
      completed INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS game_players (
      gameId TEXT NOT NULL,
      playerId TEXT NOT NULL,
      PRIMARY KEY (gameId, playerId)
    );
    CREATE TABLE IF NOT EXISTS payments (
      gameId TEXT NOT NULL,
      playerId TEXT NOT NULL,
      amount REAL DEFAULT 0,
      paid INTEGER DEFAULT 0,
      PRIMARY KEY (gameId, playerId)
    );
    CREATE TABLE IF NOT EXISTS extra_expenses (
      id TEXT PRIMARY KEY,
      gameId TEXT NOT NULL,
      label TEXT,
      amount REAL
    );
    CREATE TABLE IF NOT EXISTS shuttle_packs (
      id TEXT PRIMARY KEY,
      code TEXT NOT NULL,
      brand TEXT,
      count INTEGER,
      totalCost REAL,
      startDate TEXT,
      remaining INTEGER
    );
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      date TEXT,
      label TEXT,
      amount REAL,
      category TEXT,
      gameId TEXT
    );
  `);
  return dbInstance;
}

export const uid = (): string => Math.random().toString(36).slice(2, 12);

// ---------- PLAYERS ----------
export async function insertPlayer(p: Player): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `INSERT OR REPLACE INTO players (id,name,phone,isHost,createdAt) VALUES (?,?,?,?,?)`,
    p.id, p.name, p.phone ?? null, p.isHost ? 1 : 0, p.createdAt,
  );
}

export async function updatePlayer(id: string, patch: Partial<Player>): Promise<void> {
  const db = await getDB();
  const fields: string[] = [];
  const values: (string | number | null)[] = [];
  if (patch.name !== undefined) { fields.push('name=?'); values.push(patch.name); }
  if (patch.phone !== undefined) { fields.push('phone=?'); values.push(patch.phone); }
  if (patch.isHost !== undefined) { fields.push('isHost=?'); values.push(patch.isHost ? 1 : 0); }
  if (!fields.length) return;
  values.push(id);
  await db.runAsync(`UPDATE players SET ${fields.join(',')} WHERE id=?`, ...values);
}

export async function fetchPlayers(): Promise<Player[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{
    id: string; name: string; phone: string | null; isHost: number; createdAt: string;
  }>(`SELECT * FROM players ORDER BY createdAt ASC`);
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    phone: r.phone ?? undefined,
    isHost: !!r.isHost,
    createdAt: r.createdAt,
  }));
}

// ---------- GAMES ----------
export async function insertGame(g: Game): Promise<void> {
  const db = await getDB();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT OR REPLACE INTO games
        (id,date,courtName,numCourts,durationMinutes,hostId,courtCost,
         shuttlesUsed,shuttleAmountCollected,shuttlePackId,shuttleBroken,notes,completed,createdAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      g.id, g.date, g.courtName, g.numCourts, g.durationMinutes, g.hostId,
      g.courtCost, g.shuttlesUsed, g.shuttleAmountCollected, g.shuttlePackId ?? null,
      g.shuttleBroken ? 1 : 0, g.notes ?? null, g.completed ? 1 : 0, g.createdAt,
    );
    await db.runAsync(`DELETE FROM game_players WHERE gameId=?`, g.id);
    for (const pid of g.playerIds) {
      await db.runAsync(`INSERT INTO game_players (gameId,playerId) VALUES (?,?)`, g.id, pid);
    }
    await db.runAsync(`DELETE FROM payments WHERE gameId=?`, g.id);
    for (const p of g.payments) {
      await db.runAsync(
        `INSERT INTO payments (gameId,playerId,amount,paid) VALUES (?,?,?,?)`,
        g.id, p.playerId, p.amount, p.paid ? 1 : 0,
      );
    }
    await db.runAsync(`DELETE FROM extra_expenses WHERE gameId=?`, g.id);
    for (const e of g.extraExpenses) {
      await db.runAsync(
        `INSERT INTO extra_expenses (id,gameId,label,amount) VALUES (?,?,?,?)`,
        e.id, g.id, e.label, e.amount,
      );
    }
  });
}

export async function fetchGames(): Promise<Game[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{
    id: string; date: string; courtName: string | null; numCourts: number | null;
    durationMinutes: number | null; hostId: string; courtCost: number | null;
    shuttlesUsed: number | null; shuttleAmountCollected: number | null;
    shuttlePackId: string | null; shuttleBroken: number; notes: string | null;
    completed: number; createdAt: string;
  }>(`SELECT * FROM games ORDER BY date DESC`);

  const result: Game[] = [];
  for (const r of rows) {
    const gp = await db.getAllAsync<{ playerId: string }>(
      `SELECT playerId FROM game_players WHERE gameId=?`, r.id,
    );
    const pm = await db.getAllAsync<{ playerId: string; amount: number; paid: number }>(
      `SELECT playerId,amount,paid FROM payments WHERE gameId=?`, r.id,
    );
    const ee = await db.getAllAsync<{ id: string; label: string; amount: number }>(
      `SELECT id,label,amount FROM extra_expenses WHERE gameId=?`, r.id,
    );
    result.push({
      id: r.id,
      date: r.date,
      courtName: r.courtName ?? '',
      numCourts: r.numCourts ?? 1,
      durationMinutes: r.durationMinutes ?? 60,
      hostId: r.hostId,
      playerIds: gp.map(x => x.playerId),
      courtCost: r.courtCost ?? 0,
      shuttlesUsed: r.shuttlesUsed ?? 0,
      shuttleAmountCollected: r.shuttleAmountCollected ?? 0,
      shuttlePackId: r.shuttlePackId ?? undefined,
      shuttleBroken: !!r.shuttleBroken,
      notes: r.notes ?? undefined,
      completed: !!r.completed,
      createdAt: r.createdAt,
      payments: pm.map(x => ({ playerId: x.playerId, amount: x.amount, paid: !!x.paid })),
      extraExpenses: ee.map(x => ({ id: x.id, label: x.label, amount: x.amount })),
    });
  }
  return result;
}

export async function updateGameFlag(
  id: string,
  patch: { completed?: boolean; shuttleBroken?: boolean },
): Promise<void> {
  const db = await getDB();
  const fields: string[] = [];
  const vals: (string | number)[] = [];
  if (patch.completed !== undefined) { fields.push('completed=?'); vals.push(patch.completed ? 1 : 0); }
  if (patch.shuttleBroken !== undefined) { fields.push('shuttleBroken=?'); vals.push(patch.shuttleBroken ? 1 : 0); }
  if (!fields.length) return;
  vals.push(id);
  await db.runAsync(`UPDATE games SET ${fields.join(',')} WHERE id=?`, ...vals);
}

export async function updatePayment(
  gameId: string, playerId: string, amount: number, paid: boolean,
): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `INSERT OR REPLACE INTO payments (gameId,playerId,amount,paid) VALUES (?,?,?,?)`,
    gameId, playerId, amount, paid ? 1 : 0,
  );
}

// ---------- SHUTTLE PACKS ----------
export async function insertShuttlePack(p: ShuttlePack): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `INSERT OR REPLACE INTO shuttle_packs (id,code,brand,count,totalCost,startDate,remaining)
     VALUES (?,?,?,?,?,?,?)`,
    p.id, p.code, p.brand, p.count, p.totalCost, p.startDate, p.remaining,
  );
}

export async function fetchShuttlePacks(): Promise<ShuttlePack[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{
    id: string; code: string; brand: string; count: number;
    totalCost: number; startDate: string; remaining: number;
  }>(`SELECT * FROM shuttle_packs ORDER BY startDate DESC`);
  return rows.map(r => ({
    id: r.id, code: r.code, brand: r.brand, count: r.count,
    totalCost: r.totalCost, startDate: r.startDate, remaining: r.remaining,
  }));
}

export async function decrementShuttle(packId: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `UPDATE shuttle_packs SET remaining = MAX(remaining - 1, 0) WHERE id=?`,
    packId,
  );
}

// ---------- EXPENSES ----------
export async function insertExpense(e: Expense): Promise<void> {
  const db = await getDB();
  await db.runAsync(
    `INSERT OR REPLACE INTO expenses (id,date,label,amount,category,gameId)
     VALUES (?,?,?,?,?,?)`,
    e.id, e.date, e.label, e.amount, e.category, e.gameId ?? null,
  );
}

export async function fetchExpenses(): Promise<Expense[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<{
    id: string; date: string; label: string; amount: number;
    category: string; gameId: string | null;
  }>(`SELECT * FROM expenses ORDER BY date DESC`);
  return rows.map(r => ({
    id: r.id,
    date: r.date,
    label: r.label,
    amount: r.amount,
    category: r.category as Expense['category'],
    gameId: r.gameId ?? undefined,
  }));
}
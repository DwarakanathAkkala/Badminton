import * as SQLite from 'expo-sqlite';
import { Game, Player, ShuttlePack, Expense } from '../types';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('Badminton');
  return dbInstance;
}

// Safe UUID generator
export const uid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Current timestamp string
const now = () => new Date().toISOString();

// ---------- PLAYERS ----------
export async function insertPlayer(p: Player, userId: string): Promise<void> {
  const db = await getDB();
  const timestamp = now();
  await db.runAsync(
    `INSERT OR REPLACE INTO players (id, user_id, name, phone, is_host, created_at, updated_at) VALUES (?,?,?,?,?,?,?)`,
    p.id, userId, p.name, p.phone ?? null, p.isHost ? 1 : 0, timestamp, timestamp,
  );
}

export async function updatePlayer(id: string, patch: Partial<Player>): Promise<void> {
  const db = await getDB();
  const fields: string[] = [];
  const values: any[] = [];
  
  if (patch.name !== undefined) { fields.push('name=?'); values.push(patch.name); }
  if (patch.phone !== undefined) { fields.push('phone=?'); values.push(patch.phone); }
  if (patch.isHost !== undefined) { fields.push('is_host=?'); values.push(patch.isHost ? 1 : 0); }
  
  if (!fields.length) return;
  
  fields.push('updated_at=?');
  values.push(now());
  values.push(id);
  
  await db.runAsync(`UPDATE players SET ${fields.join(',')} WHERE id=?`, ...values);
}

export async function fetchPlayers(): Promise<Player[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<any>(`SELECT * FROM players WHERE deleted_at IS NULL ORDER BY created_at ASC`);
  return rows.map(r => ({
    id: r.id,
    name: r.name,
    phone: r.phone ?? undefined,
    isHost: !!r.is_host,
    createdAt: r.created_at,
  }));
}

// ---------- GAMES ----------
export async function insertGame(g: Game, userId: string): Promise<void> {
  const db = await getDB();
  const timestamp = now();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT OR REPLACE INTO games
        (id, user_id, date, court_name, num_courts, duration_minutes, host_id, court_cost,
         shuttles_used, shuttle_amount_collected, shuttle_pack_id, shuttle_broken, notes, completed, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      g.id, userId, g.date, g.courtName, g.numCourts, g.durationMinutes, g.hostId,
      g.courtCost, g.shuttlesUsed, g.shuttleAmountCollected, g.shuttlePackId ?? null,
      g.shuttleBroken ? 1 : 0, g.notes ?? null, g.completed ? 1 : 0, timestamp, timestamp,
    );
    
    await db.runAsync(`DELETE FROM payments WHERE game_id=?`, g.id);
    for (const p of g.payments) {
      await db.runAsync(
        `INSERT INTO payments (id, user_id, game_id, player_id, amount, paid, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`,
        uid(), userId, g.id, p.playerId, p.amount, p.paid ? 1 : 0, timestamp, timestamp,
      );
    }
    
    await db.runAsync(`DELETE FROM extra_expenses WHERE game_id=?`, g.id);
    for (const e of g.extraExpenses) {
      await db.runAsync(
        `INSERT INTO extra_expenses (id, user_id, game_id, label, amount, created_at, updated_at) VALUES (?,?,?,?,?,?,?)`,
        uid(), userId, g.id, e.label, e.amount, timestamp, timestamp,
      );
    }
  });
}

export async function fetchGames(): Promise<Game[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<any>(`SELECT * FROM games WHERE deleted_at IS NULL ORDER BY date DESC`);
  const result: Game[] = [];
  for (const r of rows) {
    const pm = await db.getAllAsync<any>(`SELECT player_id, amount, paid FROM payments WHERE game_id=? AND deleted_at IS NULL`, r.id);
    const ee = await db.getAllAsync<any>(`SELECT id, label, amount FROM extra_expenses WHERE game_id=? AND deleted_at IS NULL`, r.id);
    
    result.push({
      id: r.id,
      date: r.date,
      courtName: r.court_name ?? '',
      numCourts: r.num_courts ?? 1,
      durationMinutes: r.duration_minutes ?? 60,
      hostId: r.host_id,
      playerIds: pm.map(x => x.player_id),
      courtCost: r.court_cost ?? 0,
      shuttlesUsed: r.shuttles_used ?? 0,
      shuttleAmountCollected: r.shuttle_amount_collected ?? 0,
      shuttlePackId: r.shuttle_pack_id ?? undefined,
      shuttleBroken: !!r.shuttle_broken,
      notes: r.notes ?? undefined,
      completed: !!r.completed,
      createdAt: r.created_at,
      payments: pm.map(x => ({ playerId: x.player_id, amount: x.amount, paid: !!x.paid })),
      extraExpenses: ee.map(x => ({ id: x.id, label: x.label, amount: x.amount })),
    });
  }
  return result;
}

export async function updateGameFlag(id: string, patch: { completed?: boolean; shuttleBroken?: boolean }): Promise<void> {
  const db = await getDB();
  const fields: string[] = [];
  const vals: any[] = [];
  if (patch.completed !== undefined) { fields.push('completed=?'); vals.push(patch.completed ? 1 : 0); }
  if (patch.shuttleBroken !== undefined) { fields.push('shuttle_broken=?'); vals.push(patch.shuttleBroken ? 1 : 0); }
  if (!fields.length) return;
  
  fields.push('updated_at=?');
  vals.push(now());
  vals.push(id);
  
  await db.runAsync(`UPDATE games SET ${fields.join(',')} WHERE id=?`, ...vals);
}

export async function updatePayment(gameId: string, playerId: string, amount: number, paid: boolean, userId: string): Promise<void> {
  const db = await getDB();
  const timestamp = now();
  const existing = await db.getFirstAsync<any>(`SELECT id FROM payments WHERE game_id=? AND player_id=?`, gameId, playerId);
  
  if (existing) {
    await db.runAsync(`UPDATE payments SET amount=?, paid=?, updated_at=? WHERE id=?`, amount, paid ? 1 : 0, timestamp, existing.id);
  } else {
    await db.runAsync(
      `INSERT INTO payments (id, user_id, game_id, player_id, amount, paid, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)`, 
      uid(), userId, gameId, playerId, amount, paid ? 1 : 0, timestamp, timestamp
    );
  }
}

// ---------- SHUTTLE PACKS ----------
export async function insertShuttlePack(p: ShuttlePack, userId: string): Promise<void> {
  const db = await getDB();
  const timestamp = now();
  await db.runAsync(
    `INSERT OR REPLACE INTO shuttle_packs (id, user_id, code, brand, count, total_cost, start_date, remaining, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`,
    p.id, userId, p.code, p.brand, p.count, p.totalCost, p.startDate, p.remaining, timestamp, timestamp,
  );
}

export async function fetchShuttlePacks(): Promise<ShuttlePack[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<any>(`SELECT * FROM shuttle_packs WHERE deleted_at IS NULL ORDER BY start_date DESC`);
  return rows.map(r => ({
    id: r.id, code: r.code, brand: r.brand, count: r.count, totalCost: r.total_cost, startDate: r.start_date, remaining: r.remaining,
  }));
}

export async function decrementShuttle(packId: string): Promise<void> {
  const db = await getDB();
  await db.runAsync(`UPDATE shuttle_packs SET remaining = MAX(remaining - 1, 0), updated_at = ? WHERE id=?`, now(), packId);
}

// ---------- EXPENSES ----------
export async function insertExpense(e: Expense, userId: string): Promise<void> {
  const db = await getDB();
  const timestamp = now();
  await db.runAsync(
    `INSERT OR REPLACE INTO expenses (id, user_id, date, label, amount, category, game_id, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)`,
    e.id, userId, e.date, e.label, e.amount, e.category, e.gameId ?? null, timestamp, timestamp,
  );
}

export async function fetchExpenses(): Promise<Expense[]> {
  const db = await getDB();
  const rows = await db.getAllAsync<any>(`SELECT * FROM expenses WHERE deleted_at IS NULL ORDER BY date DESC`);
  return rows.map(r => ({
    id: r.id, date: r.date, label: r.label, amount: r.amount, category: r.category as Expense['category'], gameId: r.game_id ?? undefined,
  }));
}
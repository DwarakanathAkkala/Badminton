import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import type { PlayerWithBalance, Gender, Skill } from "../types";

export default function Players() {
  const [players, setPlayers] = useState<PlayerWithBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<PlayerWithBalance | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PlayerWithBalance | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("player_balances")
      .select("player_id, name, balance");
    if (error) { console.error(error); setLoading(false); return; }

    const { data: full, error: e2 } = await supabase
      .from("players")
      .select("*")
      .is("deleted_at", null)
      .order("name");
    if (e2) { console.error(e2); setLoading(false); return; }

    const { data: lp } = await supabase.from("player_last_played").select("*");
    const balMap = new Map((data ?? []).map((r: any) => [r.player_id, r.balance]));
    const lpMap = new Map((lp ?? []).map((r: any) => [r.player_id, r.last_played]));

    setPlayers(
      (full ?? []).map((p: any) => ({
        ...p,
        balance: balMap.get(p.id) ?? 0,
        last_played: lpMap.get(p.id) ?? null,
      }))
    );
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return players;
    return players.filter((p) => p.name.toLowerCase().includes(q));
  }, [players, query]);

  function openCreate() { setEditing(null); setShowForm(true); }
  function openEdit(p: PlayerWithBalance) { setEditing(p); setShowForm(true); }

  async function handleDelete(p: PlayerWithBalance) {
    // Soft delete: only set deleted_at. History is preserved.
    const { error } = await supabase
      .from("players")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", p.id);
    if (error) { alert("Delete failed: " + error.message); return; }
    setDeleteTarget(null);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-court">Players 👥</h1>
          <p className="text-sm text-muted">{players.length} active players</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name…"
            className="rounded-lg border border-sand bg-white px-3 py-2 text-sm"
          />
          <button
            onClick={openCreate}
            className="rounded-lg bg-court text-white px-4 py-2 text-sm font-medium"
          >
            ➕ Add Player
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-2">🏸</div>
          <p className="text-muted">No players yet. Add your first one.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              onEdit={() => openEdit(p)}
              onDelete={() => setDeleteTarget(p)}
            />
          ))}
        </div>
      )}

      {showForm && (
        <PlayerForm
          player={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirm
          player={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={() => handleDelete(deleteTarget)}
        />
      )}
    </div>
  );
}

function PlayerCard({
  player, onEdit, onDelete,
}: { player: PlayerWithBalance; onEdit: () => void; onDelete: () => void }) {
  const initials = player.name.slice(0, 2).toUpperCase();
  const emoji = player.gender === "female" ? "👧" : player.gender === "male" ? "👨" : "🏸";
  const balColor = player.balance > 0 ? "text-court" : player.balance < 0 ? "text-danger" : "text-muted";
  const balLabel =
    player.balance > 0 ? `₹${player.balance} credit`
    : player.balance < 0 ? `₹${Math.abs(player.balance)} debt`
    : "Settled";

  return (
    <div className="bg-white rounded-xl2 border border-sand p-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-11 h-11 rounded-full bg-mint flex items-center justify-center text-court font-semibold shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-ink truncate">{player.name}</p>
            <span>{emoji}</span>
            {player.is_guest && (
              <span className="text-xs bg-sand text-muted px-1.5 py-0.5 rounded">guest</span>
            )}
          </div>
          <p className={`text-sm font-medium ${balColor}`}>{balLabel}</p>
          <p className="text-xs text-muted mt-1">
            Last played: {player.last_played
              ? new Date(player.last_played).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
              : "Never"}
          </p>
          {player.skill && (
            <span className="inline-block text-xs bg-sky text-navy px-1.5 py-0.5 rounded mt-1">
              {player.skill}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <button onClick={onEdit} className="text-xs text-muted hover:text-ink">✏️ Edit</button>
        <button onClick={onDelete} className="text-xs text-muted hover:text-danger">🗑️ Delete</button>
      </div>
    </div>
  );
}

function PlayerForm({
  player, onClose, onSaved,
}: { player: PlayerWithBalance | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(player?.name ?? "");
  const [mobile, setMobile] = useState(player?.mobile ?? "");
  const [gender, setGender] = useState<Gender | "">(player?.gender ?? "");
  const [skill, setSkill] = useState<Skill | "">(player?.skill ?? "");
  const [notes, setNotes] = useState(player?.notes ?? "");
  const [isGuest, setIsGuest] = useState(player?.is_guest ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      name: name.trim(),
      mobile: mobile.trim() || null,
      gender: gender || null,
      skill: skill || null,
      notes: notes.trim() || null,
      is_guest: isGuest,
    };

    const res = player
      ? await supabase.from("players").update(payload).eq("id", player.id)
      : await supabase.from("players").insert(payload);

    setSaving(false);
    if (res.error) {
      setError(res.error.message.includes("players_name_key")
        ? "A player with this name already exists."
        : res.error.message);
      return;
    }
    onSaved();
  }

  return (
    <Modal onClose={onClose} title={player ? "Edit Player ✏️" : "Add Player ➕"}>
      <form onSubmit={save} className="space-y-3">
        <Field label="Name">
          <input
            required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-sand bg-cream px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Mobile (optional)">
          <input
            value={mobile} onChange={(e) => setMobile(e.target.value)}
            className="w-full rounded-lg border border-sand bg-cream px-3 py-2 text-sm"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Gender">
            <select
              value={gender} onChange={(e) => setGender(e.target.value as Gender | "")}
              className="w-full rounded-lg border border-sand bg-cream px-3 py-2 text-sm"
            >
              <option value="">—</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </Field>
          <Field label="Skill">
            <select
              value={skill} onChange={(e) => setSkill(e.target.value as Skill | "")}
              className="w-full rounded-lg border border-sand bg-cream px-3 py-2 text-sm"
            >
              <option value="">—</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
              <option value="pro">Pro</option>
            </select>
          </Field>
        </div>
        <Field label="Notes">
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
            className="w-full rounded-lg border border-sand bg-cream px-3 py-2 text-sm"
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox" checked={isGuest}
            onChange={(e) => setIsGuest(e.target.checked)}
          />
          This is a guest player
        </label>

        {error && (
          <div className="text-sm text-danger bg-blush border border-blush rounded-lg px-3 py-2">
            ⚠️ {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-sand px-4 py-2 text-sm">Cancel</button>
          <button type="submit" disabled={saving}
            className="rounded-lg bg-court text-white px-4 py-2 text-sm font-medium disabled:opacity-60">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteConfirm({
  player, onCancel, onConfirm,
}: { player: PlayerWithBalance; onCancel: () => void; onConfirm: () => void }) {
  return (
    <Modal onClose={onCancel} title="Remove Player? 🗑️">
      <p className="text-sm text-ink mb-2">
        You are about to remove <b>{player.name}</b> from your active list.
      </p>
      <p className="text-sm text-muted mb-4">
        Their session history and ledger entries are <b>preserved</b>. This is a soft delete —
        the player disappears from your list but the financial records stay intact.
      </p>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="rounded-lg border border-sand px-4 py-2 text-sm">
          Cancel
        </button>
        <button onClick={onConfirm} className="rounded-lg bg-danger text-white px-4 py-2 text-sm font-medium">
          Remove
        </button>
      </div>
    </Modal>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl2 border border-sand w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-sand">
          <h2 className="font-semibold text-court">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-ink">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-muted mb-1">{label}</label>
      {children}
    </div>
  );
}
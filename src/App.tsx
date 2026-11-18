import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate, NavLink } from "react-router-dom";
import { supabase } from "./lib/supabase";
import Login from "./pages/Login";
import Players from "./pages/Players";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-2xl animate-pulse">🏸</div>
      </div>
    );
  }

  if (!session) return <Login />;

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-cream">
        <header className="bg-white border-b border-sand">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏸</span>
              <span className="font-semibold text-court">Badminton Host</span>
            </div>
            <nav className="flex items-center gap-1">
              <NavItem to="/players" label="Players" emoji="👥" />
            </nav>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm text-muted hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-6">
          <Routes>
            <Route path="/players" element={<Players />} />
            <Route path="*" element={<Navigate to="/players" replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

function NavItem({ to, label, emoji }: { to: string; label: string; emoji: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `px-3 py-1.5 rounded-lg text-sm ${
          isActive ? "bg-mint text-court font-medium" : "text-muted hover:text-ink"
        }`
      }
    >
      <span className="mr-1">{emoji}</span>{label}
    </NavLink>
  );
}
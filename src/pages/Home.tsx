import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import TCAvatar from "@/components/ui/tc-avatar";
import ProgressBar from "@/components/ui/ProgressBar";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Group {
  id: string;
  name: string;
  initials: string;
  color: "green" | "blue" | "amber" | "purple" | "red";
  contribution_amount: number;
  current_round: number;
  total_rounds: number;
  total_pool: number;
  status: string;
}

function formatFCFA(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.abs(amount)) + " FCFA";
}
function formatCompact(amount: number) {
  if (amount >= 1000000) return (amount / 1000000).toFixed(1) + "M";
  if (amount >= 1000) return (amount / 1000).toFixed(0) + "k";
  return amount.toString();
}

export default function Home() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    // Fetch groups the user belongs to
    supabase
      .from("group_members")
      .select("group_id, groups(*)")
      .eq("profile_id", user.id)
      .then(({ data }) => {
        if (data) setGroups(data.map((d: any) => d.groups).filter(Boolean));
      });
    // Fetch unread notifications count
    supabase
      .from("notifications")
      .select("id", { count: "exact" })
      .eq("profile_id", user.id)
      .eq("is_read", false)
      .then(({ count }) => setUnreadCount(count ?? 0));
  }, [user]);

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="tc-gradient-hero text-white px-4 pt-12 pb-7 relative">
        <div className="absolute top-3 right-3">
          <button onClick={() => navigate("/notifications")} className="relative w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[hsl(var(--tc-red))] text-[8px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
        <p className="text-xs text-white/60 mb-1">Solde total verrouillé</p>
        <p className="text-2xl font-bold mb-0.5">{formatFCFA(profile?.total_locked ?? 0)}</p>
        <p className="text-[11px] text-white/60">{profile?.groups_count ?? 0} groupes actifs</p>
        <div className="flex gap-2 mt-4">
          <button onClick={() => navigate("/cotiser")} className="flex-1 py-2 rounded-xl bg-white/20 text-xs font-semibold text-center backdrop-blur-sm">Cotiser</button>
          <button onClick={() => navigate("/rechercher")} className="flex-1 py-2 rounded-xl bg-white/10 text-xs font-medium text-center backdrop-blur-sm">Rejoindre</button>
          <button onClick={() => navigate("/creer")} className="flex-1 py-2 rounded-xl bg-white/10 text-xs font-medium text-center backdrop-blur-sm">Créer</button>
        </div>
      </div>

      {/* Wallet */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-muted-foreground">Portefeuille disponible</p>
            <p className="text-base font-bold text-[hsl(var(--tc-green))]">{formatFCFA(profile?.wallet_balance ?? 0)}</p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[hsla(160,84%,39%,0.1)] text-[hsl(var(--tc-green))]">💳 Actif</span>
        </div>
      </div>

      {/* Groups */}
      <div className="px-4 pt-3 pb-4">
        <h2 className="text-sm font-semibold mb-3">Mes groupes</h2>
        {groups.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <p className="text-3xl mb-2">🫂</p>
            <p className="text-sm font-medium">Aucun groupe encore</p>
            <p className="text-xs mt-1">Créez ou rejoignez un groupe pour commencer</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {groups.map((g) => (
              <button
                key={g.id}
                onClick={() => navigate(`/groupe/${g.id}`)}
                className="w-full bg-card border border-border rounded-xl p-3 text-left transition-colors hover:border-[hsl(var(--tc-green))]"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <TCAvatar initials={g.initials} color={g.color} />
                    <div>
                      <p className="text-sm font-semibold">{g.name}</p>
                      <p className="text-[11px] text-muted-foreground">Tour {g.current_round}/{g.total_rounds} · {formatFCFA(g.contribution_amount)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-bold ${g.total_pool > 0 ? "text-[hsl(var(--tc-green))]" : "text-muted-foreground"}`}>
                      {g.total_pool > 0 ? `+${formatCompact(g.total_pool)}` : "0"}
                    </p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[hsla(160,84%,39%,0.1)] text-[hsl(var(--tc-green))]">Actif</span>
                  </div>
                </div>
                <ProgressBar value={(g.current_round / g.total_rounds) * 100} color={g.color} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
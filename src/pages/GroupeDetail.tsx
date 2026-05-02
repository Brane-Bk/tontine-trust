import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import TCAvatar from "@/components/ui/tc-avatar";
import ProgressBar from "@/components/ui/ProgressBar";
import { Settings, Users, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

interface Group {
  id: string; name: string; initials: string; color: any;
  contribution_amount: number; frequency: string;
  current_round: number; total_rounds: number;
  total_pool: number; guarantee_deposit: number;
  status: string; next_payout_date: string | null;
  max_members: number; members_count: number;
  penalty_rate: number; created_by: string | null;
}
interface Member {
  id: string; profile_id: string; turn_order: number; status: string;
  paid_date: string | null; role: string;
  profiles: { name: string; initials: string; } | null;
}

function formatFCFA(n: number) { return new Intl.NumberFormat("fr-FR").format(Math.abs(n)) + " FCFA"; }

export default function GroupeDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchData = () => {
    if (!id) return;
    supabase.from("groups").select("*").eq("id", id).single()
      .then(({ data }) => { if (data) setGroup(data as Group); });
    supabase.from("group_members").select("*, profiles(name, initials)")
      .eq("group_id", id).order("turn_order")
      .then(({ data }) => {
        const m = (data as Member[]) || [];
        setMembers(m);
        if (user) {
          const me = m.find((x) => x.profile_id === user.id);
          setIsMember(!!me);
          setIsAdmin(me?.role === "admin");
        }
      });
  };

  useEffect(fetchData, [id, user]);

  if (!group) {
    return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[hsl(var(--tc-green))] border-t-transparent animate-spin" /></div>;
  }

  const progress = group.total_rounds > 0 ? (group.current_round / group.total_rounds) * 100 : 0;
  const daysUntilPayout = group.next_payout_date
    ? Math.max(0, Math.ceil((new Date(group.next_payout_date).getTime() - Date.now()) / 86400000))
    : "—";

  return (
    <div className="animate-fade-in">
      <TopBar
        title={group.name}
        backTo="/home"
        backLabel="Accueil"
        rightElement={
          isAdmin ? (
            <button onClick={() => navigate("/admin")} className="text-muted-foreground hover:text-[hsl(var(--tc-green))] transition-colors">
              <Settings className="w-4 h-4" />
            </button>
          ) : undefined
        }
      />

      {/* Stats cards */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-card border border-border rounded-xl p-2.5 text-center">
            <TrendingUp className="w-3.5 h-3.5 mx-auto mb-1 text-[hsl(var(--tc-green))]" />
            <p className="text-sm font-bold text-[hsl(var(--tc-green))]">{formatFCFA(group.total_pool).replace(" FCFA", "")}</p>
            <p className="text-[9px] text-muted-foreground">Cagnotte FCFA</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-2.5 text-center">
            <Users className="w-3.5 h-3.5 mx-auto mb-1 text-[hsl(var(--tc-blue))]" />
            <p className="text-sm font-bold">{group.current_round}/{group.total_rounds}</p>
            <p className="text-[9px] text-muted-foreground">Tour actuel</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-2.5 text-center">
            <Clock className="w-3.5 h-3.5 mx-auto mb-1 text-[hsl(var(--tc-amber))]" />
            <p className="text-sm font-bold text-[hsl(var(--tc-amber))]">{daysUntilPayout}j</p>
            <p className="text-[9px] text-muted-foreground">Prochain tour</p>
          </div>
        </div>
        <ProgressBar value={progress} color={group.color || "green"} />
        <p className="text-[10px] text-muted-foreground mt-1">
          {formatFCFA(group.contribution_amount)} par {group.frequency === "Mensuelle" ? "mois" : group.frequency === "Hebdomadaire" ? "semaine" : "quinzaine"}
          {group.penalty_rate > 0 && ` · Pénalité ${group.penalty_rate}%`}
        </p>
      </div>

      {/* Members */}
      <div className="border-t border-border px-4 pt-3 pb-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Membres ({members.length}/{group.max_members})
        </h3>

        {members.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Aucun membre pour l'instant</p>
        ) : (
          <div className="flex flex-col gap-1">
            {members.map((m) => {
              const isMe = m.profile_id === user?.id;
              const isWaitingGuarantee = m.status === "waiting_guarantee";
              
              return (
                <div key={m.id} className={`flex items-center gap-2.5 py-2 px-2 rounded-lg transition-colors ${isMe ? "bg-[hsla(160,84%,39%,0.06)]" : "hover:bg-accent/50"}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    m.status === "current" ? "bg-[hsl(var(--tc-green))] text-white"
                    : m.status === "paid" ? "bg-[hsla(160,84%,39%,0.2)] text-[hsl(var(--tc-green))]"
                    : isWaitingGuarantee ? "bg-[hsla(38,92%,50%,0.2)] text-[hsl(var(--tc-amber))]"
                    : "bg-muted text-muted-foreground"
                  }`}>
                    {m.turn_order || "?"}
                  </div>
                  <TCAvatar initials={m.profiles?.initials || "?"} color="green" size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">
                      {m.profiles?.name || "Membre"} {isMe && <span className="text-[hsl(var(--tc-green))] text-[10px]">(vous)</span>}
                      {m.role === "admin" && <span className="text-[hsl(var(--tc-amber))] text-[10px] ml-1">👑</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {m.status === "paid" ? `Cotisé${m.paid_date ? " · " + new Date(m.paid_date).toLocaleDateString("fr-FR") : ""}`
                      : m.status === "current" ? "En cours · ce tour"
                      : isWaitingGuarantee ? "⏳ Attente validation caution"
                      : "En attente"}
                    </p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                    m.status === "paid" ? "bg-[hsla(160,84%,39%,0.1)] text-[hsl(var(--tc-green))]"
                    : m.status === "current" ? "bg-[hsla(38,92%,50%,0.1)] text-[hsl(var(--tc-amber))]"
                    : isWaitingGuarantee ? "bg-[hsla(38,92%,50%,0.1)] text-[hsl(var(--tc-amber))]"
                    : "bg-muted text-muted-foreground"
                  }`}>
                    {m.status === "paid" ? "✓ Fait" : m.status === "current" ? "Tour" : isWaitingGuarantee ? "Caution" : "Attente"}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Guarantee info */}
      {group.guarantee_deposit > 0 && (
        <div className="px-4 pb-3">
          <div className="p-3 rounded-xl bg-[hsla(38,92%,50%,0.08)] border border-[hsla(38,92%,50%,0.15)]">
            <p className="text-[11px] font-semibold text-[hsl(var(--tc-amber))] mb-0.5">🔒 Dépôt de garantie</p>
            <p className="text-xs text-muted-foreground">{formatFCFA(group.guarantee_deposit)} verrouillés · Remboursement en fin de cycle</p>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="px-4 pb-4">
        {isMember ? (
          <button
            onClick={() => navigate("/cotiser")}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green"
          >
            Cotiser maintenant →
          </button>
        ) : (
          <button
            onClick={() => navigate(`/rejoindre/${group.id}`)}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green"
          >
            Rejoindre ce groupe →
          </button>
        )}
      </div>
    </div>
  );
}
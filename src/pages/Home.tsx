import { useNavigate } from "react-router-dom";
import { Bell, Plus, Search, UserPlus } from "lucide-react";
import TCAvatar from "@/components/ui/tc-avatar";
import ProgressBar from "@/components/ui/ProgressBar";
import { currentUser, myGroups, formatFCFA, formatCompact } from "@/data/mockData";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="tc-gradient-hero text-white px-4 pt-12 pb-7 relative">
        <div className="absolute top-3 right-3">
          <button onClick={() => navigate("/notifications")} className="relative w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[hsl(var(--tc-red))] text-[8px] font-bold flex items-center justify-center">3</span>
          </button>
        </div>
        <p className="text-xs text-white/60 mb-1">Solde total verrouillé</p>
        <p className="text-2xl font-bold mb-0.5">{formatFCFA(currentUser.totalLocked)}</p>
        <p className="text-[11px] text-white/60">{currentUser.groupsCount} groupes actifs · prochain versement dans 8j</p>
        <div className="flex gap-2 mt-4">
          <button onClick={() => navigate("/cotiser")} className="flex-1 py-2 rounded-xl bg-white/20 text-xs font-semibold text-center backdrop-blur-sm">
            Cotiser
          </button>
          <button onClick={() => navigate("/rechercher")} className="flex-1 py-2 rounded-xl bg-white/10 text-xs font-medium text-center backdrop-blur-sm">
            Rejoindre
          </button>
          <button onClick={() => navigate("/creer")} className="flex-1 py-2 rounded-xl bg-white/10 text-xs font-medium text-center backdrop-blur-sm">
            Créer
          </button>
        </div>
      </div>

      {/* Groups */}
      <div className="px-4 pt-5 pb-4">
        <h2 className="text-sm font-semibold mb-3">Mes groupes</h2>
        <div className="flex flex-col gap-3">
          {myGroups.map((g) => (
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
                    <p className="text-[11px] text-muted-foreground">
                      Tour {g.currentRound}/{g.totalRounds} · {formatFCFA(g.contributionAmount)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${g.totalPool > 0 ? "text-[hsl(var(--tc-green))]" : "text-muted-foreground"}`}>
                    {g.totalPool > 0 ? `+${formatCompact(g.totalPool)}` : "0"}
                  </p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                    g.currentRound > 1
                      ? "bg-[hsla(160,84%,39%,0.1)] text-[hsl(var(--tc-green))]"
                      : "bg-[hsla(38,92%,50%,0.1)] text-[hsl(var(--tc-amber))]"
                  }`}>
                    {g.currentRound > 1 ? "Actif" : "Début"}
                  </span>
                </div>
              </div>
              <ProgressBar value={(g.currentRound / g.totalRounds) * 100} color={g.color} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
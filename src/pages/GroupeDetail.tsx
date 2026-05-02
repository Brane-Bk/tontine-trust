import { useNavigate, useParams } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import TCAvatar from "@/components/ui/tc-avatar";
import ProgressBar from "@/components/ui/ProgressBar";
import { myGroups, groupMembers, formatFCFA } from "@/data/mockData";
import { Settings } from "lucide-react";

export default function GroupeDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const group = myGroups.find((g) => g.id === id) || myGroups[0];

  return (
    <div className="animate-fade-in">
      <TopBar
        title={group.name}
        backTo="/home"
        backLabel="Accueil"
        rightElement={
          <button onClick={() => navigate("/admin")} className="text-muted-foreground hover:text-[hsl(var(--tc-green))]">
            <Settings className="w-4 h-4" />
          </button>
        }
      />

      {/* Stats */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-card border border-border rounded-xl p-2.5 text-center">
            <p className="text-base font-bold text-[hsl(var(--tc-green))]">{formatFCFA(group.totalPool).replace(' FCFA','')}</p>
            <p className="text-[9px] text-muted-foreground">Cagnotte FCFA</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-2.5 text-center">
            <p className="text-base font-bold">{group.currentRound}/{group.totalRounds}</p>
            <p className="text-[9px] text-muted-foreground">Tour actuel</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-2.5 text-center">
            <p className="text-base font-bold text-[hsl(var(--tc-amber))]">{group.nextPayoutDays}j</p>
            <p className="text-[9px] text-muted-foreground">Prochain tour</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsla(258,90%,66%,0.08)] border border-[hsla(258,90%,66%,0.15)]">
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--tc-green))] animate-pulse" />
          <span className="text-[11px] text-[hsl(var(--tc-purple))] font-medium">Contrat : {group.contractAddress}</span>
        </div>
      </div>

      {/* Members */}
      <div className="border-t border-border px-4 pt-3 pb-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Ordre de passage</h3>
        <div className="flex flex-col gap-1.5">
          {groupMembers.map((m) => (
            <div key={m.id} className="flex items-center gap-2.5 py-2 px-2 rounded-lg hover:bg-accent/50 transition-colors">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                m.status === "current"
                  ? "bg-[hsl(var(--tc-green))] text-white"
                  : "bg-muted text-muted-foreground"
              }`}>
                {m.order}
              </div>
              <TCAvatar initials={m.initials} color={m.color} size="sm" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">{m.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {m.status === "paid" ? `Cotisé · ${m.paidDate}` : m.status === "current" ? "En cours · ce mois" : "En attente"}
                </p>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                m.status === "paid"
                  ? "bg-[hsla(160,84%,39%,0.1)] text-[hsl(var(--tc-green))]"
                  : m.status === "current"
                  ? "bg-[hsla(38,92%,50%,0.1)] text-[hsl(var(--tc-amber))]"
                  : "bg-muted text-muted-foreground"
              }`}>
                {m.status === "paid" ? "Fait" : m.status === "current" ? "Tour" : "Attente"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Guarantee info */}
      <div className="px-4 pb-3">
        <div className="p-3 rounded-xl bg-[hsla(38,92%,50%,0.08)] border border-[hsla(38,92%,50%,0.15)]">
          <p className="text-[11px] font-semibold text-[hsl(var(--tc-amber))] mb-1">🔒 Dépôt de garantie</p>
          <p className="text-xs text-muted-foreground">
            {formatFCFA(group.guaranteeDeposit)} verrouillés · Remboursement en fin de cycle
          </p>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4">
        <button
          onClick={() => navigate("/cotiser")}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green"
        >
          Cotiser maintenant →
        </button>
      </div>
    </div>
  );
}
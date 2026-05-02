import { useNavigate, useParams } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import { openGroups, myGroups, currentUser, formatFCFA } from "@/data/mockData";

export default function Rejoindre() {
  const navigate = useNavigate();
  const { id } = useParams();
  const group = [...openGroups, ...myGroups].find((g) => g.id === id) || openGroups[0];
  const scoreOk = currentUser.score >= group.minScore;

  return (
    <div className="animate-slide-up">
      <TopBar title="Rejoindre" backTo="/rechercher" backLabel="Rechercher" />
      <div className="px-4 pb-6">
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl tc-gradient-green flex items-center justify-center mx-auto mb-3 tc-shadow-green">
            <span className="text-white text-xl font-bold">{group.initials}</span>
          </div>
          <h2 className="text-lg font-bold">{group.name}</h2>
          <p className="text-xs text-muted-foreground">{group.membersCount}/{group.maxMembers} membres · {group.frequency}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-[hsl(var(--tc-green))]">{formatFCFA(group.contributionAmount).replace(' FCFA','')}</p>
            <p className="text-[9px] text-muted-foreground">FCFA/mois</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold">{group.maxMembers}</p>
            <p className="text-[9px] text-muted-foreground">membres max</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-lg font-bold">{group.penaltyRate}%</p>
            <p className="text-[9px] text-muted-foreground">pénalité retard</p>
          </div>
        </div>

        {/* Contract address */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsla(258,90%,66%,0.08)] border border-[hsla(258,90%,66%,0.15)] mb-4">
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--tc-green))] animate-pulse" />
          <span className="text-[11px] text-[hsl(var(--tc-purple))] font-medium">Contrat : {group.contractAddress}</span>
        </div>

        {/* Guarantee deposit */}
        <div className="p-3 rounded-xl bg-[hsla(38,92%,50%,0.08)] border border-[hsla(38,92%,50%,0.15)] mb-4">
          <p className="text-[11px] font-semibold text-[hsl(var(--tc-amber))] mb-1">⚠️ Dépôt de garantie obligatoire</p>
          <p className="text-xs text-muted-foreground">
            Caution : <strong className="text-foreground">{formatFCFA(group.guaranteeDeposit)}</strong> (remboursable en fin de cycle)
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">
            Ce montant sera verrouillé dans le smart contract pour garantir vos cotisations.
          </p>
        </div>

        {/* Score check */}
        <div className={`p-3 rounded-xl border mb-4 ${
          scoreOk
            ? "bg-[hsla(160,84%,39%,0.08)] border-[hsla(160,84%,39%,0.15)]"
            : "bg-[hsla(0,84%,60%,0.08)] border-[hsla(0,84%,60%,0.15)]"
        }`}>
          <p className={`text-[11px] font-semibold mb-1 ${scoreOk ? "text-[hsl(var(--tc-green))]" : "text-[hsl(var(--tc-red))]"}`}>
            {scoreOk ? "✓" : "✗"} Conditions d'adhésion
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Score minimum requis : {group.minScore} · Votre score : {currentUser.score} {scoreOk ? "✓" : "✗"}
            <br />Caution : {formatFCFA(group.guaranteeDeposit)} (remboursable)
          </p>
        </div>

        <button
          onClick={() => navigate("/cotiser")}
          disabled={!scoreOk}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green disabled:opacity-50"
        >
          Rejoindre ce groupe →
        </button>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          Votre caution sera verrouillée dans le smart contract
        </p>
      </div>
    </div>
  );
}
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import ProgressBar from "@/components/ui/ProgressBar";
import { ChevronRight } from "lucide-react";

export default function Admin() {
  const navigate = useNavigate();

  const actions = [
    { label: "Exclure un membre", color: "text-[hsl(var(--tc-red))]", path: "/groupe/1" },
    { label: "Inviter un nouveau membre", color: "text-[hsl(var(--tc-green))]" },
    { label: "Rapport du groupe (PDF)", color: "text-[hsl(var(--tc-blue))]", path: "/historique" },
    { label: "Contacter le support", color: "text-[hsl(var(--tc-purple))]" },
  ];

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Admin"
        backTo="/profil"
        backLabel="Profil"
        rightElement={
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-[hsla(258,90%,66%,0.12)] text-[hsl(var(--tc-purple))]">
            Fondatrice
          </span>
        }
      />
      <div className="px-4 pb-6">
        {/* Alert */}
        <div className="p-3 rounded-xl bg-[hsla(38,92%,50%,0.08)] border border-[hsla(38,92%,50%,0.15)] mb-4">
          <p className="text-[11px] font-semibold text-[hsl(var(--tc-amber))] mb-1">⚠️ Action requise</p>
          <p className="text-xs text-muted-foreground">
            Amina K. est en retard de 7j. Le contrat a appliqué -2 500 FCFA de pénalité.
          </p>
        </div>

        {/* Actions */}
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Actions admin</h3>
        <div className="flex flex-col gap-2 mb-5">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => a.path && navigate(a.path)}
              className="flex items-center justify-between p-3 rounded-xl border border-border bg-card text-xs hover:bg-accent/50 transition-colors"
            >
              <span>{a.label}</span>
              <span className={a.color}>→</span>
            </button>
          ))}
        </div>

        {/* Vote */}
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Vote multi-sig</h3>
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs font-semibold mb-1">Proposition : exclure Amina K.</p>
          <p className="text-[11px] text-muted-foreground mb-2">Votes reçus : 6 / 10 requis</p>
          <ProgressBar value={60} className="mb-3" />
          <div className="flex gap-2">
            <button className="flex-1 py-2 rounded-xl bg-[hsla(160,84%,39%,0.12)] text-[hsl(var(--tc-green))] text-[11px] font-semibold">
              Voter Oui
            </button>
            <button className="flex-1 py-2 rounded-xl border border-border text-[11px] text-muted-foreground">
              Voter Non
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import { transactions } from "@/data/mockData";

const filters = ["Tout", "Reçus", "Cotisations", "Pénalités"];

export default function Historique() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("Tout");

  const filtered = transactions.filter((t) => {
    if (activeFilter === "Tout") return true;
    if (activeFilter === "Reçus") return t.type === "payout";
    if (activeFilter === "Cotisations") return t.type === "contribution";
    if (activeFilter === "Pénalités") return t.type === "penalty";
    return true;
  });

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Historique"
        backTo="/home"
        backLabel="Accueil"
        rightElement={<span className="text-[11px] text-[hsl(var(--tc-blue))] font-medium cursor-pointer">Blockchain ↗</span>}
      />

      <div className="flex gap-1.5 px-4 mb-4 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-colors ${
              activeFilter === f
                ? "bg-[hsl(var(--tc-green))] text-white"
                : "border border-border text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="px-4 pb-4">
        {filtered.map((t) => (
          <button
            key={t.id}
            onClick={() => t.type === "payout" ? navigate("/confirmation") : undefined}
            className="w-full flex items-center gap-3 py-3 border-b border-border last:border-0 text-left"
          >
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold ${
              t.type === "payout"
                ? "bg-[hsla(160,84%,39%,0.12)] text-[hsl(var(--tc-green))]"
                : t.type === "contribution"
                ? "bg-[hsla(0,84%,60%,0.12)] text-[hsl(var(--tc-red))]"
                : "bg-[hsla(258,90%,66%,0.12)] text-[hsl(var(--tc-purple))]"
            }`}>
              {t.type === "payout" ? "↓" : t.type === "contribution" ? "↑" : "⬡"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{t.name}</p>
              <p className="text-[10px] text-muted-foreground">{t.date} · {t.hash}</p>
            </div>
            <span className={`text-sm font-bold ${
              t.amount > 0
                ? "text-[hsl(var(--tc-green))]"
                : t.amount < 0
                ? "text-[hsl(var(--tc-red))]"
                : "text-[hsl(var(--tc-purple))]"
            }`}>
              {t.amount > 0 ? `+${(t.amount/1000).toFixed(0)}k` : t.amount < 0 ? `${(t.amount/1000).toFixed(0)}k` : "Contrat"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
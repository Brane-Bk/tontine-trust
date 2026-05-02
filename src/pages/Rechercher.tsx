import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import TCAvatar from "@/components/ui/tc-avatar";
import { openGroups, formatFCFA } from "@/data/mockData";

const filters = ["Tous", "Proches", "Premium", "Diaspora"];

export default function Rechercher() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [search, setSearch] = useState("");

  const filtered = openGroups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-fade-in">
      <TopBar title="Explorer" backTo="/home" backLabel="Accueil" />

      <div className="px-4 mb-3">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card">
          <Search className="w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un groupe..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

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
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Groupes ouverts</h3>
        <div className="flex flex-col gap-2.5">
          {filtered.map((g) => (
            <button
              key={g.id}
              onClick={() => navigate(`/rejoindre/${g.id}`)}
              disabled={g.status === "full"}
              className={`w-full bg-card border border-border rounded-xl p-3 text-left transition-colors ${
                g.status === "full" ? "opacity-50" : "hover:border-[hsl(var(--tc-green))]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <TCAvatar initials={g.initials} color={g.color} />
                  <div>
                    <p className="text-sm font-semibold">{g.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {g.membersCount}/{g.maxMembers} places · {formatFCFA(g.contributionAmount)}/mois
                    </p>
                  </div>
                </div>
                {g.status === "full" ? (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground">Complet</span>
                ) : (
                  <span className="text-[11px] font-semibold text-[hsl(var(--tc-green))]">Rejoindre →</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
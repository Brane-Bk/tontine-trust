import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, PlusCircle, Wallet, User } from "lucide-react";

const tabs = [
  {
    path: "/home",
    label: "Accueil",
    icon: Home,
    match: (p: string) =>
      p === "/home" ||
      p.startsWith("/notifications") ||
      p.startsWith("/groupe/") ||
      p.startsWith("/creer"),
  },
  { path: "/portefeuille", label: "Portefeuille", icon: Wallet, match: (p: string) => p.startsWith("/portefeuille") },
  {
    path: "/rechercher",
    label: "Groupes",
    icon: Search,
    match: (p: string) => p.startsWith("/rechercher") || p.startsWith("/rejoindre/"),
  },
  {
    path: "/cotiser",
    label: "Cotiser",
    icon: PlusCircle,
    match: (p: string) => p.startsWith("/cotiser") || p.startsWith("/confirmation"),
  },
  {
    path: "/profil",
    label: "Profil",
    icon: User,
    match: (p: string) =>
      p.startsWith("/profil") ||
      p.startsWith("/parametres") ||
      p.startsWith("/score") ||
      p.startsWith("/historique") ||
      p.startsWith("/admin"),
  },
];

export default function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="flex items-center justify-around border-t border-border/80 bg-card/95 backdrop-blur-sm px-1 py-1.5 shrink-0">
      {tabs.map((tab) => {
        const active = tab.match(path);
        const Icon = tab.icon;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-0.5 min-w-0 flex-1 max-w-[4.5rem] py-1 rounded-lg transition-colors text-[9px] sm:text-[10px] font-medium ${
              active
                ? "text-[hsl(var(--tc-green))]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-[1.15rem] h-[1.15rem] sm:w-5 sm:h-5 shrink-0" strokeWidth={active ? 2.5 : 1.5} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
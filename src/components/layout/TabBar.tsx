import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, PlusCircle, BarChart3, User } from "lucide-react";

const tabs = [
  { path: "/home", label: "Accueil", icon: Home },
  { path: "/rechercher", label: "Groupes", icon: Search },
  { path: "/cotiser", label: "Cotiser", icon: PlusCircle },
  { path: "/score", label: "Score", icon: BarChart3 },
  { path: "/profil", label: "Profil", icon: User },
];

export default function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="flex items-center justify-around border-t border-border bg-card px-2 py-1.5 shrink-0">
      {tabs.map((tab) => {
        const active = location.pathname.startsWith(tab.path);
        const Icon = tab.icon;
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors text-[10px] font-medium ${
              active
                ? "text-[hsl(var(--tc-green))]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.5} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import { useAuth } from "@/hooks/useAuth";
import { Clock, Bell, Settings, ChevronRight, LogOut } from "lucide-react";
import { toast } from "sonner";

function formatFCFA(amount: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.abs(amount)) + " FCFA";
}

export default function Profil() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Déconnecté avec succès");
    navigate("/connexion");
  };

  if (!profile) return null;

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Mon profil"
        rightElement={
          <button onClick={() => navigate("/parametres")} className="text-muted-foreground hover:text-foreground">
            <Settings className="w-4 h-4" />
          </button>
        }
      />

      {/* Avatar */}
      <div className="flex flex-col items-center pt-4 pb-5">
        <div className="w-16 h-16 rounded-full bg-[hsla(160,84%,39%,0.12)] border-2 border-[hsla(160,84%,39%,0.2)] flex items-center justify-center text-2xl font-bold text-[hsl(var(--tc-green))] mb-2">
          {profile.initials || profile.name?.charAt(0).toUpperCase()}
        </div>
        <p className="text-lg font-bold">{profile.name}</p>
        <p className="text-[11px] text-muted-foreground">{profile.email}</p>
        <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsla(160,84%,39%,0.08)] border border-[hsla(160,84%,39%,0.15)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--tc-green))]" />
          <span className="text-[10px] text-[hsl(var(--tc-green))] font-medium">Portefeuille : {formatFCFA(profile.wallet_balance)}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 px-4 mb-5">
        <button onClick={() => navigate("/score")} className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-[hsl(var(--tc-green))]">{profile.score}</p>
          <p className="text-[9px] text-muted-foreground">Score</p>
        </button>
        <button onClick={() => navigate("/rechercher")} className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-lg font-bold">{profile.groups_count}</p>
          <p className="text-[9px] text-muted-foreground">Groupes actifs</p>
        </button>
        <button onClick={() => navigate("/historique")} className="bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-lg font-bold">{profile.cycles_completed}</p>
          <p className="text-[9px] text-muted-foreground">Cycles terminés</p>
        </button>
      </div>

      {/* Quick links */}
      <div className="px-4 pb-4">
        {[
          { label: "Historique des transactions", icon: Clock, path: "/historique" },
          { label: "Notifications", icon: Bell, path: "/notifications" },
          { label: "Paramètres", icon: Settings, path: "/parametres" },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="w-full flex items-center justify-between py-3 border-b border-border text-left"
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{item.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 py-3 text-left text-[hsl(var(--tc-red))]"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Se déconnecter</span>
        </button>
      </div>
    </div>
  );
}
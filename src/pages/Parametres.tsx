import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import { useTheme } from "@/contexts/ThemeContext";
import { ChevronRight } from "lucide-react";

export default function Parametres() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const sections = [
    {
      title: "Écran & Affichage",
      items: [
        {
          icon: "☀️",
          iconBg: "bg-[hsla(258,90%,66%,0.12)]",
          name: "Mode Sombre / Clair",
          sub: "Basculer le thème de l'app",
          toggle: true,
          checked: theme === "dark",
          onToggle: toggleTheme,
        },
      ],
    },
    {
      title: "Sécurité",
      items: [
        { icon: "🔐", iconBg: "bg-[hsla(160,84%,39%,0.12)]", name: "Modifier le PIN", sub: "Dernier changement : il y a 30j", arrow: true },
        { icon: "👆", iconBg: "bg-[hsla(217,91%,60%,0.12)]", name: "Biométrie", sub: "Empreinte / Face ID", toggle: true, checked: false },
        { icon: "🔑", iconBg: "bg-[hsla(258,90%,66%,0.12)]", name: "Contacts de confiance", sub: "2 contacts configurés", arrow: true },
      ],
    },
    {
      title: "Comptes",
      items: [
        { icon: "📱", iconBg: "bg-[hsla(38,92%,50%,0.12)]", name: "Portefeuilles liés", sub: "MTN MoMo · Moov Money · Celtiis Cash", arrow: true },
        { icon: "🌍", iconBg: "bg-[hsla(160,84%,39%,0.12)]", name: "Langue", sub: "Français", arrow: true },
        { icon: "📞", iconBg: "bg-[hsla(217,91%,60%,0.12)]", name: "Mode USSD", sub: "Raccourci *784#", toggle: true, checked: false },
      ],
    },
    {
      title: "Notifications",
      items: [
        { icon: "🔔", iconBg: "bg-[hsla(38,92%,50%,0.12)]", name: "Push notifications", toggle: true, checked: true },
        { icon: "💬", iconBg: "bg-[hsla(160,84%,39%,0.12)]", name: "Alertes SMS", toggle: true, checked: true },
      ],
    },
  ];

  return (
    <div className="animate-fade-in">
      <TopBar title="Paramètres" backTo="/profil" backLabel="Profil" />
      <div className="pb-6">
        {sections.map((section) => (
          <div key={section.title}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 pt-3 pb-1.5">
              {section.title}
            </h3>
            {section.items.map((item) => (
              <div
                key={item.name}
                className="flex items-center justify-between px-4 py-3 border-b border-border cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => {
                  if (item.onToggle) item.onToggle();
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${item.iconBg}`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    {item.sub && <p className="text-[10px] text-muted-foreground">{item.sub}</p>}
                  </div>
                </div>
                {item.toggle && (
                  <div className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${item.checked ? "bg-[hsl(var(--tc-green))]" : "bg-muted"}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${item.checked ? "translate-x-4" : ""}`} />
                  </div>
                )}
                {item.arrow && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
        ))}

        <div className="px-4 pt-4">
          <button
            onClick={() => navigate("/")}
            className="w-full py-2.5 rounded-xl border border-[hsla(0,84%,60%,0.3)] text-[hsl(var(--tc-red))] text-sm font-semibold"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}
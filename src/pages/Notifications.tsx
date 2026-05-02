import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import { notifications } from "@/data/mockData";

const dotColors = {
  green: "bg-[hsl(var(--tc-green))]",
  amber: "bg-[hsl(var(--tc-amber))]",
  red: "bg-[hsl(var(--tc-red))]",
  blue: "bg-[hsl(var(--tc-blue))]",
};

export default function Notifications() {
  const navigate = useNavigate();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="animate-fade-in">
      <TopBar
        title="Notifications"
        backTo="/home"
        backLabel="Accueil"
        rightElement={
          unreadCount > 0 ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-[hsla(0,84%,60%,0.12)] text-[hsl(var(--tc-red))]">
              {unreadCount}
            </span>
          ) : undefined
        }
      />
      <div className="pb-4">
        {notifications.map((n) => (
          <button
            key={n.id}
            onClick={() => navigate(n.navigateTo)}
            className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-border transition-colors hover:bg-accent/50 ${
              !n.read ? "bg-accent/30" : ""
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${dotColors[n.color]}`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold mb-0.5">{n.title}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{n.message}</p>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{n.time}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface TopBarProps {
  title: string;
  backTo?: string;
  backLabel?: string;
  rightElement?: React.ReactNode;
}

export default function TopBar({ title, backTo, backLabel, rightElement }: TopBarProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between px-4 py-2.5 shrink-0">
      {backTo ? (
        <button
          onClick={() => navigate(backTo)}
          className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-[hsl(var(--tc-green))] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          {backLabel || "Retour"}
        </button>
      ) : (
        <span />
      )}
      <span className="text-sm font-semibold">{title}</span>
      {rightElement || <span className="w-12" />}
    </div>
  );
}
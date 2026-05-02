import TopBar from "@/components/layout/TopBar";
import ProgressBar from "@/components/ui/ProgressBar";
import { currentUser, scoreBreakdown } from "@/data/mockData";

export default function Score() {
  const scorePercent = (currentUser.score / currentUser.maxScore) * 100;

  return (
    <div className="animate-fade-in">
      <TopBar title="Score Gbè" backTo="/home" backLabel="Accueil" />
      <div className="px-4 pb-6">
        {/* Score circle */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-32 h-32 mb-3">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke="hsl(160, 84%, 39%)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${scorePercent * 3.14} ${(100 - scorePercent) * 3.14}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold">{currentUser.score}</span>
              <span className="text-[10px] text-muted-foreground">/ {currentUser.maxScore}</span>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[hsla(160,84%,39%,0.12)] text-[hsl(var(--tc-green))]">
            Excellent
          </span>
        </div>

        {/* Breakdown */}
        <div className="flex flex-col gap-3 mb-6">
          {scoreBreakdown.map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-3">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-semibold">{s.label}</span>
                <span className="text-muted-foreground">{s.value}% · poids {s.weight}%</span>
              </div>
              <ProgressBar value={s.value} color={s.color} />
            </div>
          ))}
        </div>

        {/* Tips */}
        <div className="p-3 rounded-xl bg-[hsla(217,91%,60%,0.08)] border border-[hsla(217,91%,60%,0.15)]">
          <p className="text-[11px] font-semibold text-[hsl(var(--tc-blue))] mb-1">💡 Conseil</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Cotisez à temps pour maintenir votre score. Un score ≥ 700 débloque les groupes Premium.
          </p>
        </div>
      </div>
    </div>
  );
}
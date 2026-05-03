import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import TCAvatar from "@/components/ui/tc-avatar";
import ProgressBar from "@/components/ui/ProgressBar";
import { Settings, Users, Clock, TrendingUp, Shield, Database, Cpu, Link2, CheckCircle2, CircleDashed, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { runTontineAutomation } from "@/lib/tontineAutomation";

interface Group {
  id: string;
  name: string;
  initials: string;
  color: string;
  contribution_amount: number;
  frequency: "Hebdomadaire" | "Bimensuelle" | "Mensuelle" | "Trimestrielle";
  current_round: number;
  total_rounds: number;
  total_pool: number;
  guarantee_deposit: number;
  status: "pending" | "active" | "completed" | "cancelled";
  next_payout_date: string | null;
  cotisation_deadline_at: string | null;
  max_members: number;
  members_count: number;
  penalty_rate: number;
  created_by: string | null;
}

interface Member {
  id: string;
  profile_id: string;
  turn_order: number;
  status: "waiting" | "paid" | "late" | "excluded";
  paid_date: string | null;
  role: "admin" | "member";
  guarantee_status: "pending" | "verified" | "rejected";
  profiles: { name: string; initials: string } | null;
}

const NETWORK_FEE = 20;

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.abs(n)) + " FCFA";
}

function deadlineLabel(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = Date.now();
  const ms = d.getTime() - now;
  if (ms <= 0) return "Échéance dépassée · prélèvement auto si solde suffisant";
  const days = Math.ceil(ms / 86400000);
  const hours = Math.ceil(ms / 3600000);
  if (days > 1) return `${days} j. restants`;
  if (hours > 1) return `${hours} h restantes`;
  return "Moins d’1 h";
}

export default function GroupeDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchData = useCallback(async () => {
    if (!id) return;
    await runTontineAutomation();
    const [{ data: gRow }, { data: mRows }] = await Promise.all([
      supabase.from("groups").select("*").eq("id", id).single(),
      supabase.from("group_members").select("*, profiles(name, initials)").eq("group_id", id).order("turn_order"),
    ]);
    if (gRow) setGroup(gRow as Group);
    const m = (mRows as Member[]) || [];
    setMembers(m);
    if (user) {
      const me = m.find((x) => x.profile_id === user.id);
      setIsMember(!!me);
      setIsAdmin(me?.role === "admin");
    }
  }, [id, user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (!group) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[hsl(var(--tc-green))] border-t-transparent animate-spin" />
      </div>
    );
  }

  const progress = group.total_rounds > 0 ? (group.current_round / group.total_rounds) * 100 : 0;
  const daysUntilPayout = group.next_payout_date
    ? Math.max(0, Math.ceil((new Date(group.next_payout_date).getTime() - Date.now()) / 86400000))
    : "—";

  const sorted = [...members].sort((a, b) => (a.turn_order || 0) - (b.turn_order || 0));
  const beneficiaryId =
    group.current_round > 0 ? sorted.find((m) => m.turn_order === group.current_round)?.profile_id : null;
  const paidCount = sorted.filter((m) => m.status === "paid").length;
  const totalDue = sorted.filter((m) => m.status !== "excluded").length;

  return (
    <div className="animate-fade-in pb-6">
      <TopBar
        title={group.name}
        backTo="/home"
        backLabel="Accueil"
        rightElement={
          isAdmin ? (
            <button type="button" onClick={() => navigate("/admin")} className="text-muted-foreground hover:text-[hsl(var(--tc-green))] transition-colors" aria-label="Administration">
              <Settings className="w-4 h-4" />
            </button>
          ) : undefined
        }
      />

      <div className="px-4 pb-3">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-card border border-border/80 rounded-xl p-2.5 text-center shadow-sm">
            <TrendingUp className="w-3.5 h-3.5 mx-auto mb-1 text-[hsl(var(--tc-green))]" />
            <p className="text-sm font-bold text-[hsl(var(--tc-green))]">{formatFCFA(group.total_pool).replace(" FCFA", "")}</p>
            <p className="text-[9px] text-muted-foreground">Cagnotte</p>
          </div>
          <div className="bg-card border border-border/80 rounded-xl p-2.5 text-center shadow-sm">
            <Users className="w-3.5 h-3.5 mx-auto mb-1 text-[hsl(var(--tc-blue))]" />
            <p className="text-sm font-bold">
              {paidCount}/{totalDue}
            </p>
            <p className="text-[9px] text-muted-foreground">Payé ce tour</p>
          </div>
          <div className="bg-card border border-border/80 rounded-xl p-2.5 text-center shadow-sm">
            <Clock className="w-3.5 h-3.5 mx-auto mb-1 text-[hsl(var(--tc-amber))]" />
            <p className="text-sm font-bold text-muted-foreground">{typeof daysUntilPayout === "number" ? `${daysUntilPayout}j` : daysUntilPayout}</p>
            <p className="text-[9px] text-muted-foreground">Échéance</p>
          </div>
        </div>
        <ProgressBar value={progress} color={group.color || "green"} />
        <p className="text-[10px] text-muted-foreground mt-1.5 leading-relaxed">
          {formatFCFA(group.contribution_amount)} + {NETWORK_FEE} FCFA frais · {group.frequency.toLowerCase()}
          {group.penalty_rate > 0 && ` · pénalité ${group.penalty_rate}%`}
        </p>
      </div>

      {/* Registre blockchain — tons doux */}
      <div className="px-4 mb-4">
        <div className="rounded-2xl border border-[hsla(160,28%,38%,0.18)] bg-gradient-to-br from-[hsla(160,22%,97%,0.95)] to-[hsla(210,25%,98%,0.98)] dark:from-[hsla(220,18%,14%,0.92)] dark:to-[hsla(220,16%,11%,0.95)] p-3.5 tc-grid-bg-soft relative overflow-hidden shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[hsla(160,32%,42%,0.12)] flex items-center justify-center">
                <Link2 className="w-4 h-4 text-[hsl(var(--tc-green))]" />
              </div>
              <div>
                <h3 className="text-[11px] font-semibold text-foreground/90 tracking-tight">Registre TontineChain</h3>
                <p className="text-[9px] text-muted-foreground">Ordre des tours figé · consultable à tout moment</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[hsla(160,28%,42%,0.1)] text-[8px] font-medium text-[hsl(160,30%,32%)] dark:text-[hsl(160,25%,65%)] flex items-center gap-1 border border-[hsla(160,25%,40%,0.12)]">
              <Cpu className="w-2.5 h-2.5" /> vérifiable
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div>
              <p className="text-[8px] uppercase tracking-wide text-muted-foreground mb-0.5">Identifiant log</p>
              <p className="text-[10px] font-mono-tech truncate text-[hsl(160,28%,34%)] dark:text-[hsl(160,22%,72%)]">
                0x{(group.id || "").replace(/-/g, "").slice(0, 18)}…
              </p>
            </div>
            <div>
              <p className="text-[8px] uppercase tracking-wide text-muted-foreground mb-0.5">État</p>
              <p className="text-[10px] font-medium flex items-center gap-1 text-foreground/85">
                <Database className="w-3 h-3 text-[hsl(var(--tc-blue))] opacity-70" />
                {group.status === "active" ? "Actif" : group.status}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Liste de ramassage */}
      <div className="px-4 pb-3">
        <div className="flex items-end justify-between gap-2 mb-2">
          <div>
            <h3 className="text-xs font-semibold text-foreground/90">Liste de ramassage</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Tour {Math.max(group.current_round, 1)} · bénéficiaire :{" "}
              <span className="font-medium text-foreground/80">
                {beneficiaryId
                  ? sorted.find((m) => m.profile_id === beneficiaryId)?.profiles?.name || "—"
                  : "—"}
              </span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-muted-foreground">Fin cotisation</p>
            <p className="text-[10px] font-medium text-foreground/85">{deadlineLabel(group.cotisation_deadline_at)}</p>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed rounded-lg bg-muted/40 px-2.5 py-2 border border-border/60">
          <Shield className="w-3 h-3 inline-block mr-1 align-text-bottom text-[hsl(var(--tc-green))] opacity-80" />
          Un dépôt via <strong className="font-medium">Portefeuille</strong> augmente votre solde. Une cotisation par{" "}
          <strong className="font-medium">Mobile Money</strong> alimente directement la cagnotte sans créditer le portefeuille. À
          l’échéance, un prélèvement automatique est tenté si le solde suffit.
        </p>

        {sorted.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">Aucun membre pour l’instant</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sorted.map((m) => {
              const isMe = m.profile_id === user?.id;
              const order = m.turn_order || 0;
              const isBeneficiary = group.current_round > 0 && order === group.current_round;
              const alreadyReceived = group.current_round > 0 && order < group.current_round;
              const isWaitingGuarantee = m.guarantee_status === "pending" && group.guarantee_deposit > 0;

              let phaseLabel = "Tour à venir";
              if (alreadyReceived) phaseLabel = "A déjà ramassé";
              if (isBeneficiary) phaseLabel = "Bénéficiaire de ce tour";

              const PayIcon = m.status === "paid" ? CheckCircle2 : m.status === "late" ? AlertCircle : CircleDashed;

              return (
                <li
                  key={m.id}
                  className={`rounded-xl border px-3 py-2.5 flex gap-3 items-center transition-colors ${
                    isBeneficiary
                      ? "border-[hsla(160,30%,40%,0.25)] bg-[hsla(160,22%,96%,0.65)] dark:bg-[hsla(160,15%,16%,0.35)]"
                      : "border-border/70 bg-card/80"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      isBeneficiary
                        ? "bg-[hsla(160,35%,42%,0.2)] text-[hsl(160,32%,30%)] dark:text-[hsl(160,25%,78%)]"
                        : alreadyReceived
                          ? "bg-muted text-muted-foreground"
                          : "bg-muted/80 text-foreground/70"
                    }`}
                  >
                    {order}
                  </div>
                  <TCAvatar initials={m.profiles?.initials || "?"} color="green" size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs font-semibold truncate">
                        {m.profiles?.name || "Membre"}
                        {isMe && <span className="text-[hsl(var(--tc-green))] font-normal text-[10px] ml-1">(vous)</span>}
                        {m.role === "admin" && <span className="text-[10px] ml-0.5 opacity-70">· admin</span>}
                      </p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{phaseLabel}</p>
                    {m.status === "paid" && m.paid_date && (
                      <p className="text-[9px] text-muted-foreground/90 mt-0.5">
                        Payé le {new Date(m.paid_date).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-0.5">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md ${
                        m.status === "paid"
                          ? "bg-[hsla(160,32%,42%,0.12)] text-[hsl(160,30%,30%)] dark:text-[hsl(160,22%,72%)]"
                          : m.status === "late"
                            ? "bg-[hsla(25,40%,94%,0.9)] text-[hsl(25,35%,38%)] dark:bg-[hsla(25,25%,22%,0.5)]"
                            : "bg-muted/90 text-muted-foreground"
                      }`}
                    >
                      <PayIcon className="w-3 h-3" />
                      {m.status === "paid" ? "Payé" : m.status === "late" ? "Retard" : "À payer"}
                    </span>
                    {isWaitingGuarantee && (
                      <span className="text-[8px] text-[hsl(var(--tc-amber))]">Caution</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {sorted.some((m) => group.current_round > 0 && (m.turn_order || 0) > group.current_round) && (
          <p className="text-[9px] text-muted-foreground mt-2 text-center opacity-80">
            Les membres « tour à venir » cotiseront aux prochains cycles.
          </p>
        )}
      </div>

      {group.guarantee_deposit > 0 && (
        <div className="px-4 pb-3">
          <div className="p-3 rounded-xl bg-[hsla(45,28%,95%,0.85)] border border-[hsla(38,22%,82%,0.7)] dark:bg-[hsla(35,15%,18%,0.4)]">
            <p className="text-[11px] font-medium text-foreground/85 mb-0.5">Dépôt de garantie</p>
            <p className="text-xs text-muted-foreground">{formatFCFA(group.guarantee_deposit)} verrouillés · fin de cycle</p>
          </div>
        </div>
      )}

      <div className="px-4">
        {isMember ? (
          <button
            type="button"
            onClick={() => navigate("/cotiser")}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white tc-gradient-green-soft tc-shadow-green-soft"
          >
            Cotiser pour ce groupe →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => navigate(`/rejoindre/${group.id}`)}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white tc-gradient-green-soft tc-shadow-green-soft"
          >
            Rejoindre ce groupe →
          </button>
        )}
      </div>
    </div>
  );
}

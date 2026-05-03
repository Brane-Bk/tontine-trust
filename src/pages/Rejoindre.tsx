import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { initPayment, payFromWallet } from "@/lib/talypay";
import PhoneInput from "@/components/ui/PhoneInput";
import { toast } from "sonner";
import {
  Loader2, Check, Users, Shield, Info, Lock,
  Coins, AlertTriangle, Calendar, ChevronRight
} from "lucide-react";

type Frequency = "Journalier" | "Hebdomadaire" | "Bimensuelle" | "Mensuelle" | "Trimestrielle";

interface Group {
  id: string;
  name: string;
  initials: string;
  contribution_amount: number;
  frequency: Frequency;
  members_count: number;
  max_members: number;
  penalty_rate: number;
  guarantee_deposit: number;
  min_score: number;
  status: "pending" | "active" | "completed" | "cancelled";
  total_rounds: number;
  order_type?: string;
}

const FREQ_LABEL: Record<string, string> = {
  Journalier: "jour",
  Hebdomadaire: "semaine",
  Bimensuelle: "quinzaine",
  Mensuelle: "mois",
  Trimestrielle: "trimestre",
};

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(n) + " FCFA";
}

export default function Rejoindre() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, profile, refreshProfile } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [phone, setPhone] = useState(profile?.phone || "");
  const [step, setStep] = useState<"info" | "guarantee" | "processing" | "done">("info");
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [guaranteeType, setGuaranteeType] = useState<"money" | "bank" | "property">("money");
  const [guaranteeProof, setGuaranteeProof] = useState("");
  const [useWallet, setUseWallet] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from("groups").select("*").eq("id", id).single()
      .then(({ data }) => setGroup(data as Group));
  }, [id]);

  useEffect(() => {
    if (profile?.phone) setPhone(profile.phone);
  }, [profile]);

  useEffect(() => {
    if (!user || !id) return;
    supabase.from("group_members")
      .select("id")
      .eq("group_id", id)
      .eq("profile_id", user.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setAlreadyMember(true); });
  }, [user, id]);

  if (!group) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[hsl(var(--tc-green))] border-t-transparent animate-spin" />
      </div>
    );
  }

  const scoreOk = !profile || profile.score >= group.min_score;
  // Re-fetch live count before checking (prevents race condition)
  const hasGuarantee = group.guarantee_deposit > 0;
  const expectedPayout = group.contribution_amount * group.max_members;
  const isFull = group.members_count >= group.max_members;
  const isCompleted = group.status === "completed" || group.status === "cancelled";
  const orderLabel = group.order_type === "manual" ? "Ordre manuel" : "Ordre tiré au sort";

  const handleJoin = async () => {
    if (!user || !profile) return;

    // Re-fetch live members count to prevent race condition
    const { data: freshGroup } = await supabase
      .from("groups")
      .select("members_count, max_members, status")
      .eq("id", group.id)
      .single();

    if (freshGroup && freshGroup.members_count >= freshGroup.max_members) {
      toast.error("Ce groupe vient d'être complet. Essayez-en un autre.");
      navigate("/rechercher");
      return;
    }
    if (freshGroup && freshGroup.status !== "pending") {
      toast.error("Ce groupe n'est plus ouvert aux inscriptions.");
      navigate("/rechercher");
      return;
    }

    setStep("processing");

    try {
      // Save phone if changed
      if (phone && phone !== profile.phone) {
        await supabase.from("profiles").update({ phone }).eq("id", user.id);
      }

      if (hasGuarantee) {
        setStep("guarantee");
        return;
      }

      // Get current members count for turn_order
      const { count } = await supabase
        .from("group_members")
        .select("id", { count: "exact", head: true })
        .eq("group_id", group.id);

      const nextTurn = (count ?? 0) + 1;

      const { error } = await supabase.from("group_members").insert({
        group_id: group.id,
        profile_id: user.id,
        role: "member",
        turn_order: nextTurn,
        status: "waiting",
        guarantee_status: "verified",
      });

      if (error?.code === "23505") {
        toast.error("Vous êtes déjà membre de ce groupe");
        navigate(`/groupe/${group.id}`);
        return;
      }
      if (error) throw error;

      await refreshProfile();
      setStep("done");
    } catch (err: any) {
      console.error("[Rejoindre] Full Error:", err);
      const details = err.details || err.hint || "";
      toast.error(err.message + (details ? ` (${details})` : "") || "Erreur lors de l'adhésion");
      setStep("info");
    }
  };

  const handleGuaranteeSubmit = async () => {
    if (!user || !group) return;
    setStep("processing");

    try {
      if (guaranteeType === "money") {
        let result;
        if (useWallet) {
          if ((profile?.wallet_balance || 0) < group.guarantee_deposit) {
            toast.error("Solde du portefeuille insuffisant pour la caution");
            setStep("guarantee");
            return;
          }
          result = await payFromWallet({
            amount: group.guarantee_deposit,
            profile_id: user.id,
            group_id: group.id,
            transaction_type: "guarantee",
            transaction_name: `Caution — ${group.name}`,
          });
        } else {
          result = await initPayment({
            amount: group.guarantee_deposit,
            customer_phone: phone,
            profile_id: user.id,
            group_id: group.id,
            transaction_type: "guarantee",
            transaction_name: `Caution — ${group.name}`,
            operator: "MTN",
          });
        }
        if (!result.success) {
          toast.error(result.message || "Échec du paiement de la caution");
          setStep("guarantee");
          return;
        }
      } else {
        if (!guaranteeProof.trim()) {
          toast.error("Veuillez fournir les détails de votre garantie");
          setStep("guarantee");
          return;
        }
      }

      // Get live count for turn_order
      const { count } = await supabase
        .from("group_members")
        .select("id", { count: "exact", head: true })
        .eq("group_id", group.id);

      const nextTurn = (count ?? 0) + 1;

      const { error: joinError } = await supabase.from("group_members").insert({
        group_id: group.id,
        profile_id: user.id,
        role: "member",
        turn_order: nextTurn,
        status: "waiting",
        guarantee_type: guaranteeType,
        guarantee_proof: guaranteeProof,
        guarantee_status: guaranteeType === "money" ? "verified" : "pending",
      });

      if (joinError) throw joinError;

      await refreshProfile();
      setStep("done");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la soumission de la garantie");
      setStep("info");
    }
  };

  // ─── GUARANTEE STEP ──────────────────────────────────────────────────────────
  if (step === "guarantee") {
    return (
      <div className="animate-slide-up bg-background min-h-screen pb-8">
        <TopBar title="Dépôt de Garantie" backTo={() => setStep("info")} />
        <div className="px-4">
          <div className="p-3 rounded-xl bg-[hsla(38,92%,50%,0.08)] border border-[hsla(38,92%,50%,0.2)] mb-5">
            <p className="text-[11px] font-semibold text-[hsl(var(--tc-amber))] mb-1">
              🔒 Pourquoi une garantie ?
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Ce groupe exige une caution de <strong className="text-foreground">{formatFCFA(group.guarantee_deposit)}</strong>. 
              Elle est bloquée jusqu'à la fin du cycle et remboursée si vous avez payé toutes vos cotisations. 
              En cas d'exclusion pour impayé, elle couvre les dettes.
            </p>
          </div>

          <label className="block text-xs font-semibold text-muted-foreground mb-2">
            Choisissez le type de garantie :
          </label>
          <div className="flex flex-col gap-2 mb-5">
            {[
              { val: "money" as const, icon: "💳", label: "Versement en argent", desc: `${formatFCFA(group.guarantee_deposit)} bloqués jusqu'à la fin du cycle.` },
              { val: "bank" as const, icon: "🏦", label: "Garantie Bancaire", desc: "Référence bancaire. Examen par l'administrateur requis." },
              { val: "property" as const, icon: "🏠", label: "Titre de Propriété", desc: "Terrain, véhicule ou bien équivalent. Examen manuel requis." },
            ].map((g) => (
              <button
                key={g.val}
                type="button"
                onClick={() => setGuaranteeType(g.val)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  guaranteeType === g.val
                    ? "border-[hsl(var(--tc-green))] bg-[hsla(160,84%,39%,0.06)]"
                    : "border-border bg-card"
                }`}
              >
                <p className="text-sm font-bold">{g.icon} {g.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{g.desc}</p>
              </button>
            ))}
          </div>

          {guaranteeType === "money" && (
            <div className="animate-fade-in mb-5">
              <label className="flex items-center gap-2.5 p-3 border border-border bg-card rounded-xl mb-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useWallet}
                  onChange={(e) => setUseWallet(e.target.checked)}
                  className="w-4 h-4 rounded accent-[hsl(var(--tc-green))]"
                />
                <div>
                  <span className="text-sm font-medium">Payer depuis mon portefeuille</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Solde disponible : {formatFCFA(profile?.wallet_balance || 0)}
                  </p>
                </div>
              </label>
              {!useWallet && (
                <PhoneInput label="Numéro Mobile Money" value={phone} onChange={setPhone} placeholder="01 XX XX XX XX" />
              )}
            </div>
          )}

          {(guaranteeType === "bank" || guaranteeType === "property") && (
            <div className="animate-fade-in mb-5">
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Détails et références de votre garantie
              </label>
              <textarea
                value={guaranteeProof}
                onChange={(e) => setGuaranteeProof(e.target.value)}
                placeholder={
                  guaranteeType === "bank"
                    ? "Ex : Garantie BOA n° 1234567, agence Cotonou Centre..."
                    : "Ex : Titre foncier n° 9876, Parcelle C, Abomey-Calavi..."
                }
                className="w-full bg-card border border-border rounded-xl p-3 text-sm min-h-[100px] outline-none focus:border-[hsl(var(--tc-green))] transition-colors resize-none"
              />
              <p className="text-[10px] text-[hsl(var(--tc-amber))] mt-1.5 leading-relaxed">
                ⚠️ Votre adhésion sera en attente de validation par l'administrateur du groupe. En cas de garantie foncière, le titre doit être vérifié avant activation. Tout membre qui reçoit la cagnotte puis quitte sans avoir terminé son cycle sera privé de la garantie et pourra faire l'objet de poursuites.
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={handleGuaranteeSubmit}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white tc-gradient-green tc-shadow-green"
          >
            Confirmer la garantie →
          </button>
        </div>
      </div>
    );
  }

  // ─── PROCESSING ──────────────────────────────────────────────────────────────
  if (step === "processing") {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center gap-5 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-[hsla(160,84%,39%,0.1)] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-[hsl(var(--tc-green))] animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold">Adhésion en cours...</p>
          <p className="text-xs text-muted-foreground mt-1">
            {hasGuarantee ? "Traitement de la caution en sécurité" : "Enregistrement dans le registre du groupe"}
          </p>
        </div>
      </div>
    );
  }

  // ─── SUCCESS ──────────────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="flex flex-col min-h-screen animate-fade-in">
        <div className="flex-1 px-4 pt-12 text-center">
          <div className="w-20 h-20 rounded-full bg-[hsla(160,84%,39%,0.12)] flex items-center justify-center mx-auto mb-4 animate-check-bounce">
            <Check className="w-10 h-10 text-[hsl(var(--tc-green))]" strokeWidth={3} />
          </div>
          <h2 className="text-xl font-bold mb-2">Bienvenue dans "{group.name}" !</h2>
          <p className="text-xs text-muted-foreground mb-5 leading-relaxed px-4">
            {guaranteeType !== "money" && group.guarantee_deposit > 0
              ? "⏳ Votre caution est en cours d'examen. Vous recevrez une notification une fois validée."
              : "✅ Vous êtes maintenant membre du groupe. Cotisez dès que le groupe est actif."}
          </p>

          <div className="bg-[hsla(160,84%,39%,0.06)] border border-[hsla(160,84%,39%,0.15)] rounded-xl p-4 text-left mb-6 mx-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Comment ça marche maintenant ?
            </p>
            <div className="space-y-1.5 text-[11px] text-muted-foreground leading-relaxed">
              <p>① Le groupe démarre quand TOUS les membres ont rejoint.</p>
              <p>② À chaque tour, cotisez <strong className="text-foreground">{formatFCFA(group.contribution_amount + 20)}</strong> ({formatFCFA(group.contribution_amount)} + 20 frais).</p>
              <p>③ Quand tout le monde a payé, la cagnotte de <strong className="text-foreground">{formatFCFA(group.contribution_amount * group.total_rounds)}</strong> est versée automatiquement au bénéficiaire du tour.</p>
              <p>④ Un retard bloque votre portefeuille. Payez à temps !</p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/groupe/${group.id}`)}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green mb-3"
          >
            Voir le groupe →
          </button>
          <button onClick={() => navigate("/home")} className="text-xs text-muted-foreground">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // ─── INFO (main view) ─────────────────────────────────────────────────────────
  return (
    <div className="animate-slide-up pb-8">
      <TopBar title="Rejoindre un groupe" backTo="/rechercher" backLabel="Explorer" />
      <div className="px-4">

        {alreadyMember && (
          <div className="bg-[hsla(160,84%,39%,0.08)] border border-[hsla(160,84%,39%,0.2)] rounded-xl p-3 mb-4 text-center">
            <p className="text-xs text-[hsl(var(--tc-green))] font-semibold">✓ Vous êtes déjà membre de ce groupe</p>
            <button
              onClick={() => navigate(`/groupe/${group.id}`)}
              className="text-xs text-[hsl(var(--tc-green))] underline mt-1"
            >
              Voir le groupe →
            </button>
          </div>
        )}

        {/* Header groupe */}
        <div className="text-center mb-5">
          <div className="w-16 h-16 rounded-2xl tc-gradient-green flex items-center justify-center mx-auto mb-3 tc-shadow-green">
            <span className="text-white text-xl font-bold">{group.initials}</span>
          </div>
          <h2 className="text-lg font-bold">{group.name}</h2>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
            <Users className="w-3 h-3" />
            {group.members_count}/{group.max_members} membres · {group.frequency}
          </p>
        </div>

        {/* Stats financières */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <Coins className="w-3.5 h-3.5 mx-auto mb-1 text-[hsl(var(--tc-green))]" />
            <p className="text-sm font-bold text-[hsl(var(--tc-green))]">
              {new Intl.NumberFormat("fr-FR").format(group.contribution_amount)}
            </p>
            <p className="text-[9px] text-muted-foreground">FCFA/{FREQ_LABEL[group.frequency] || "tour"}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <Calendar className="w-3.5 h-3.5 mx-auto mb-1 text-[hsl(var(--tc-blue))]" />
            <p className="text-sm font-bold">{group.total_rounds}</p>
            <p className="text-[9px] text-muted-foreground">tours total</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <Coins className="w-3.5 h-3.5 mx-auto mb-1 text-[hsl(var(--tc-amber))]" />
            <p className="text-sm font-bold text-[hsl(var(--tc-amber))]">
              {new Intl.NumberFormat("fr-FR").format(expectedPayout)}
            </p>
            <p className="text-[9px] text-muted-foreground">FCFA à recevoir</p>
          </div>
        </div>

        {/* Explication du fonctionnement */}
        <div className="p-3 rounded-xl bg-card border border-border mb-4">
          <p className="text-[10px] font-semibold mb-2 flex items-center gap-1">
            <Info className="w-3 h-3 text-[hsl(var(--tc-blue))]" />
            Comment fonctionne ce groupe
          </p>
          <div className="space-y-1 text-[10px] text-muted-foreground leading-relaxed">
            <p>• Chaque membre cotise <strong className="text-foreground">{formatFCFA(group.contribution_amount)}</strong> à chaque tour ({group.frequency})</p>
            <p>• Quand tous ont payé, le bénéficiaire du tour reçoit <strong className="text-foreground">{formatFCFA(expectedPayout)}</strong></p>
            <p>• Le cycle dure <strong className="text-foreground">{group.total_rounds} tours</strong> — chaque membre reçoit une fois</p>
            <p>• Ordre de distribution : <strong className="text-foreground">{orderLabel}</strong></p>
            {group.penalty_rate > 0 && (
              <p>• Pénalité de retard : <strong className="text-[hsl(var(--tc-amber))]">{group.penalty_rate}%</strong></p>
            )}
          </div>
        </div>

        {/* Garantie */}
        {hasGuarantee && (
          <div className="p-3 rounded-xl bg-[hsla(38,92%,50%,0.08)] border border-[hsla(38,92%,50%,0.15)] mb-4">
            <p className="text-[11px] font-semibold text-[hsl(var(--tc-amber))] mb-1 flex items-center gap-1">
              <Lock className="w-3 h-3" /> Dépôt de garantie requis
            </p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Une caution de <strong className="text-foreground">{formatFCFA(group.guarantee_deposit)}</strong> sera exigée à l'étape suivante. 
              Elle est bloquée jusqu'à la fin du cycle et remboursée si vous avez cotisé à temps.
            </p>
            <p className="text-[10px] text-[hsl(var(--tc-amber))] mt-2">
              Les titres de propriété ou garanties bancaires sont acceptés. Si un membre reçoit la cagnotte puis tente de quitter sans terminer son cycle, il perdra cette garantie et des poursuites pourront être engagées.
            </p>
          </div>
        )}

        {/* Score check */}
        <div className={`p-3 rounded-xl border mb-5 ${
          scoreOk
            ? "bg-[hsla(160,84%,39%,0.06)] border-[hsla(160,84%,39%,0.15)]"
            : "bg-[hsla(0,84%,60%,0.06)] border-[hsla(0,84%,60%,0.15)]"
        }`}>
          <p className={`text-[11px] font-semibold mb-0.5 flex items-center gap-1 ${
            scoreOk ? "text-[hsl(var(--tc-green))]" : "text-[hsl(var(--tc-red))]"
          }`}>
            {scoreOk ? <Shield className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
            {scoreOk ? "Conditions remplies" : "Score insuffisant"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Score requis : {group.min_score} · Votre score : {profile?.score ?? "—"} {scoreOk ? "✓" : "✗"}
          </p>
          {!scoreOk && (
            <p className="text-[10px] text-muted-foreground mt-1">
              Améliorez votre score en cotisant à l'heure dans vos groupes actuels.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={handleJoin}
          disabled={!scoreOk || isFull || alreadyMember || isCompleted}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white tc-gradient-green tc-shadow-green disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {alreadyMember ? "Déjà membre ✓" : isCompleted ? "Inscriptions closes" : isFull ? "Groupe complet" : hasGuarantee
            ? <><Lock className="w-4 h-4" /> {`Rejoindre · Caution ${formatFCFA(group.guarantee_deposit)}`}</>
            : <><ChevronRight className="w-4 h-4" /> Rejoindre ce groupe</>}
        </button>
        {!alreadyMember && !isFull && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            🔒 Enregistrement sécurisé · TontineChain Protocol
          </p>
        )}
      </div>
    </div>
  );
}
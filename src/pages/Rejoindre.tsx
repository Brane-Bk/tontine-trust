import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import { initPayment, payFromWallet } from "@/lib/talypay";
import PhoneInput from "@/components/ui/PhoneInput";
import { toast } from "sonner";
import { Loader2, Check, Users } from "lucide-react";

interface Group {
  id: string; name: string; initials: string;
  contribution_amount: number; frequency: string;
  members_count: number; max_members: number;
  penalty_rate: number; guarantee_deposit: number;
  min_score: number; status: string;
}

function formatFCFA(n: number) { return new Intl.NumberFormat("fr-FR").format(n) + " FCFA"; }

type JoinStep = "info" | "processing" | "done";

export default function Rejoindre() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, profile, refreshProfile } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [phone, setPhone] = useState(profile?.phone || "");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"info" | "guarantee" | "processing" | "done">("info");
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [guaranteeType, setGuaranteeType] = useState<"money"|"bank"|"property">("money");
  const [guaranteeProof, setGuaranteeProof] = useState("");
  const [useWallet, setUseWallet] = useState(false);

  useEffect(() => {
    if (!id) return;
    supabase.from("groups").select("*").eq("id", id).single()
      .then(({ data }) => setGroup(data as Group));
  }, [id]);

  useEffect(() => { if (profile?.phone) setPhone(profile.phone); }, [profile]);

  // Check membership
  useEffect(() => {
    if (!user || !id) return;
    supabase.from("group_members").select("id").eq("group_id", id).eq("profile_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setAlreadyMember(true); });
  }, [user, id]);

  if (!group) {
    return <div className="flex min-h-screen items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[hsl(var(--tc-green))] border-t-transparent animate-spin" /></div>;
  }

  const scoreOk = !profile || profile.score >= group.min_score;
  const isFull = group.members_count >= group.max_members;
  const hasGuarantee = group.guarantee_deposit > 0;

  const handleJoin = async () => {
    if (!user || !profile) return;
    if (hasGuarantee && (!phone || phone.replace(/\D/g, "").length < 8)) {
      toast.error("Entrez un numéro de téléphone valide pour le paiement");
      return;
    }

    setStep("processing");

    try {
      // Save phone
      if (phone && phone !== profile.phone) {
        await supabase.from("profiles").update({ phone }).eq("id", user.id);
      }

      // S'il y a un dépôt de garantie, on passe à l'étape garantie
      if (hasGuarantee) {
        setStep("guarantee");
        return;
      }

      setStep("processing");

      // Add member
      const nextTurn = group.members_count + 1;
      const { error } = await supabase.from("group_members").insert({
        group_id: group.id,
        profile_id: user.id,
        role: "member",
        turn_order: nextTurn,
        status: "waiting",
      });
      if (error && error.code === "23505") {
        toast.error("Vous êtes déjà membre de ce groupe");
        navigate(`/groupe/${group.id}`);
        return;
      }
      if (error) throw error;

      // Update profile
      await supabase.from("profiles").update({ groups_count: (profile.groups_count || 0) + 1 }).eq("id", user.id);
      await refreshProfile();

      setStep("done");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'adhésion");
      setStep("info");
    }
  };

  const handleGuaranteeSubmit = async () => {
    try {
      if (!user || !group) return;
      setStep("processing");

      let status = "waiting";

      if (guaranteeType === "money") {
        let result;
        if (useWallet) {
          if ((profile?.wallet_balance || 0) < group.guarantee_deposit) {
            toast.error("Solde du portefeuille insuffisant");
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
        // bank or property: Needs manual validation
        if (!guaranteeProof.trim()) {
          toast.error("Veuillez fournir les détails de la garantie");
          setStep("guarantee");
          return;
        }
        status = "waiting_guarantee";
      }

      const nextTurn = group.members_count + 1;
      // Insérer le membre
      const { error: joinError } = await supabase.from("group_members").insert({
        group_id: group.id,
        profile_id: user.id,
        role: "member",
        turn_order: nextTurn,
        status: status,
        guarantee_type: guaranteeType,
        guarantee_proof: guaranteeProof,
        guarantee_status: guaranteeType === "money" ? "verified" : "pending"
      });

      if (joinError) throw joinError;

      await refreshProfile();
      setStep("done");
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la soumission de la garantie");
      setStep("info");
    }
  };

  // ─── ÉTAPE 1.5 : GARANTIE ──────────────────────────────────────────────────
  if (step === "guarantee") {
    return (
      <div className="animate-slide-up bg-background min-h-screen">
        <TopBar title="Dépôt de Garantie" backTo={() => setStep("info")} />
        <div className="px-4 pb-6">
          <p className="text-sm font-medium mb-4">Ce groupe exige une garantie d'une valeur de <strong className="text-[hsl(var(--tc-green))]">{new Intl.NumberFormat("fr-FR").format(group.guarantee_deposit)} FCFA</strong>.</p>
          
          <label className="block text-xs font-semibold text-muted-foreground mb-2">Choisissez le type de garantie :</label>
          <div className="flex flex-col gap-2 mb-6">
            <button onClick={() => setGuaranteeType("money")} className={`p-3 rounded-xl border-2 text-left transition-all ${guaranteeType === "money" ? "border-[hsl(var(--tc-green))] bg-[hsla(160,84%,39%,0.06)]" : "border-border bg-card"}`}>
              <p className="text-sm font-bold">💳 Versement en argent</p>
              <p className="text-xs text-muted-foreground mt-0.5">Le montant sera bloqué sur votre compte jusqu'à la fin de la tontine.</p>
            </button>
            <button onClick={() => setGuaranteeType("bank")} className={`p-3 rounded-xl border-2 text-left transition-all ${guaranteeType === "bank" ? "border-[hsl(var(--tc-green))] bg-[hsla(160,84%,39%,0.06)]" : "border-border bg-card"}`}>
              <p className="text-sm font-bold">🏦 Garantie Bancaire</p>
              <p className="text-xs text-muted-foreground mt-0.5">Fournissez une référence bancaire. Sera examinée par l'administrateur.</p>
            </button>
            <button onClick={() => setGuaranteeType("property")} className={`p-3 rounded-xl border-2 text-left transition-all ${guaranteeType === "property" ? "border-[hsl(var(--tc-green))] bg-[hsla(160,84%,39%,0.06)]" : "border-border bg-card"}`}>
              <p className="text-sm font-bold">🏠 Titre de Propriété</p>
              <p className="text-xs text-muted-foreground mt-0.5">Biens de valeur équivalente (terrain, véhicule...). Examen manuel requis.</p>
            </button>
          </div>

          {guaranteeType === "money" && (
            <div className="animate-fade-in mb-6">
              <label className="flex items-center gap-2 p-3 border border-border bg-card rounded-xl mb-4 cursor-pointer">
                <input type="checkbox" checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} className="rounded text-[hsl(var(--tc-green))] focus:ring-[hsl(var(--tc-green))]" />
                <span className="text-sm font-medium">Utiliser mon portefeuille ({new Intl.NumberFormat("fr-FR").format(profile?.wallet_balance || 0)} FCFA)</span>
              </label>

              {!useWallet && (
                <PhoneInput label="Numéro Mobile Money" value={phone} onChange={setPhone} placeholder="01 XX XX XX XX" />
              )}
            </div>
          )}

          {(guaranteeType === "bank" || guaranteeType === "property") && (
            <div className="animate-fade-in mb-6">
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Détails et références de la garantie</label>
              <textarea 
                value={guaranteeProof} 
                onChange={(e) => setGuaranteeProof(e.target.value)} 
                placeholder={guaranteeType === "bank" ? "Ex: Garantie BOA n° 1234567..." : "Ex: Titre foncier n° 9876, Parcelle C..."}
                className="w-full bg-card border border-border rounded-xl p-3 text-sm min-h-[100px] outline-none focus:border-[hsl(var(--tc-green))]"
              ></textarea>
              <p className="text-[10px] text-[hsl(var(--tc-amber))] mt-2">Votre adhésion sera en attente de la validation de cette preuve par l'administrateur.</p>
            </div>
          )}

          <button onClick={handleGuaranteeSubmit} className="w-full py-3.5 rounded-xl text-sm font-bold text-white tc-gradient-green tc-shadow-green mb-4">
            Soumettre la garantie
          </button>
        </div>
      </div>
    );
  }

  // ─── PROCESSING ─────────────────────────────────────────────────
  if (step === "processing") {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center gap-5 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-[hsla(160,84%,39%,0.1)] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-[hsl(var(--tc-green))] animate-spin" />
        </div>
        <p className="text-sm font-semibold">Adhésion en cours...</p>
        <p className="text-xs text-muted-foreground">{hasGuarantee ? "Paiement de la caution via TalyPay" : "Inscription dans le groupe"}</p>
      </div>
    );
  }

  // ─── SUCCESS ────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <div className="flex flex-col min-h-screen animate-fade-in">
        <div className="flex-1 px-4 pt-12 text-center">
          <div className="w-20 h-20 rounded-full bg-[hsla(160,84%,39%,0.12)] flex items-center justify-center mx-auto mb-4 animate-check-bounce">
            <Check className="w-10 h-10 text-[hsl(var(--tc-green))]" strokeWidth={3} />
          </div>
          <h2 className="text-xl font-bold mb-1">Bienvenue dans "{group.name}" !</h2>
          <p className="text-xs text-muted-foreground mb-8">
            {guaranteeType !== "money" && group.guarantee_deposit > 0 
              ? "Votre caution non-financière est en cours d'examen. Vous recevrez une notification une fois validée." 
              : "Vous êtes maintenant membre du groupe."}
          </p>
          <button onClick={() => navigate(`/groupe/${group.id}`)} className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green mb-3">
            Voir le groupe →
          </button>
          <button onClick={() => navigate("/home")} className="text-xs text-muted-foreground">Retour à l'accueil</button>
        </div>
      </div>
    );
  }

  // ─── INFO ───────────────────────────────────────────────────────
  return (
    <div className="animate-slide-up">
      <TopBar title="Rejoindre un groupe" backTo="/rechercher" backLabel="Explorer" />
      <div className="px-4 pb-6">

        {/* Already member banner */}
        {alreadyMember && (
          <div className="bg-[hsla(160,84%,39%,0.08)] border border-[hsla(160,84%,39%,0.2)] rounded-xl p-3 mb-4 text-center">
            <p className="text-xs text-[hsl(var(--tc-green))] font-semibold">✓ Vous êtes déjà membre de ce groupe</p>
            <button onClick={() => navigate(`/groupe/${group.id}`)} className="text-xs text-[hsl(var(--tc-green))] underline mt-1">Voir le groupe →</button>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl tc-gradient-green flex items-center justify-center mx-auto mb-3 tc-shadow-green">
            <span className="text-white text-xl font-bold">{group.initials}</span>
          </div>
          <h2 className="text-lg font-bold">{group.name}</h2>
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
            <Users className="w-3 h-3" /> {group.members_count}/{group.max_members} membres · {group.frequency}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-base font-bold text-[hsl(var(--tc-green))]">{new Intl.NumberFormat("fr-FR").format(group.contribution_amount)}</p>
            <p className="text-[9px] text-muted-foreground">FCFA/{group.frequency === "Mensuelle" ? "mois" : "période"}</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-base font-bold">{group.max_members}</p>
            <p className="text-[9px] text-muted-foreground">places</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 text-center">
            <p className="text-base font-bold">{group.penalty_rate}%</p>
            <p className="text-[9px] text-muted-foreground">pénalité</p>
          </div>
        </div>

        {/* Phone input (only if guarantee needed) */}
        {hasGuarantee && (
          <div className="p-3 rounded-xl bg-[hsla(38,92%,50%,0.08)] border border-[hsla(38,92%,50%,0.15)] mb-4 text-center">
            <p className="text-[11px] font-semibold text-[hsl(var(--tc-amber))] mb-0.5">⚠️ Dépôt de garantie requis</p>
            <p className="text-xs text-muted-foreground">
              Une caution de <strong className="text-foreground">{formatFCFA(group.guarantee_deposit)}</strong> sera demandée à l'étape suivante.
            </p>
          </div>
        )}

        {/* Score check */}
        <div className={`p-3 rounded-xl border mb-4 ${scoreOk ? "bg-[hsla(160,84%,39%,0.06)] border-[hsla(160,84%,39%,0.15)]" : "bg-[hsla(0,84%,60%,0.06)] border-[hsla(0,84%,60%,0.15)]"}`}>
          <p className={`text-[11px] font-semibold mb-0.5 ${scoreOk ? "text-[hsl(var(--tc-green))]" : "text-[hsl(var(--tc-red))]"}`}>
            {scoreOk ? "✓ Conditions remplies" : "✗ Score insuffisant"}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Score min. : {group.min_score} · Votre score : {profile?.score ?? "—"} {scoreOk ? "✓" : ""}
          </p>
        </div>

        <button
          onClick={handleJoin}
          disabled={loading || !scoreOk || isFull || alreadyMember}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white tc-gradient-green tc-shadow-green disabled:opacity-40"
        >
          {alreadyMember ? "Déjà membre" : isFull ? "Groupe complet" : hasGuarantee ? `Rejoindre · ${formatFCFA(group.guarantee_deposit)} →` : "Rejoindre ce groupe →"}
        </button>
        {hasGuarantee && !alreadyMember && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">🔒 Garanties sécurisées (Argent, Banque, Biens)</p>
        )}
      </div>
    </div>
  );
}
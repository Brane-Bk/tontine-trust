import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { initPayment, payFromWallet, TalyPayResponse } from "@/lib/talypay";
import PhoneInput from "@/components/ui/PhoneInput";
import { toast } from "sonner";

const OPERATORS = [
  { id: "mtn", name: "MTN MoMo", shortName: "MTN", color: "#FFA500", textColor: "#fff" },
  { id: "moov", name: "Moov Money", shortName: "Moov", color: "#003B8C", textColor: "#fff" },
  { id: "celtiis", name: "Celtiis Cash", shortName: "Celtiis", color: "#FF4500", textColor: "#fff" },
  { id: "wallet", name: "Portefeuille Tontine", shortName: "Wallet", color: "#10B981", textColor: "#fff" },
];

interface Group { 
  id: string; 
  name: string; 
  contribution_amount: number; 
}

type PayStep = "form" | "confirm" | "processing" | "done" | "error";

export default function Cotiser() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [operator, setOperator] = useState("mtn");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [step, setStep] = useState<PayStep>("form");
  const [payResult, setPayResult] = useState<TalyPayResponse | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("group_members")
      .select("group_id, groups(id, name, contribution_amount)")
      .eq("profile_id", user.id)
      .then(({ data }) => {
        const grps = (data || []).map((d: any) => d.groups).filter(Boolean);
        setGroups(grps);
        if (grps.length > 0) setSelectedGroup(grps[0]);
      });
  }, [user]);

  useEffect(() => { if (profile?.phone) setPhone(profile.phone); }, [profile]);

  const fees = 20;
  const total = (selectedGroup?.contribution_amount || 0) + fees;

  const handleConfirm = async () => {
    const needPhone = operator !== "wallet";
    const digits = phone.replace(/\D/g, "");
    if (!user || !selectedGroup) {
      toast.error("Sélectionnez un groupe");
      return;
    }
    if (needPhone && digits.length < 8) {
      toast.error("Numéro de téléphone invalide");
      return;
    }
    setStep("processing");

    if (needPhone && phone !== profile?.phone) {
      await supabase.from("profiles").update({ phone }).eq("id", user.id);
    }

    let result: TalyPayResponse;
    if (operator === "wallet") {
      result = await payFromWallet({
        amount: total,
        profile_id: user.id,
        group_id: selectedGroup.id,
        transaction_type: "contribution",
        transaction_name: `Cotisation — ${selectedGroup.name}`,
      });
    } else {
      result = await initPayment({
        amount: total,
        currency: "XOF",
        customer_phone: phone,
        profile_id: user.id,
        group_id: selectedGroup.id,
        transaction_type: "contribution",
        transaction_name: `Cotisation — ${selectedGroup.name}`,
        operator: operator,
      });
    }

    setPayResult(result);
    if (result.success) {
      // Mettre à jour le statut du membre à "paid"
      await supabase
        .from("group_members")
        .update({ status: "paid", paid_date: new Date().toISOString() })
        .eq("group_id", selectedGroup.id)
        .eq("profile_id", user.id);

      await refreshProfile();
      setStep("done");
    } else {
      setStep("error");
    }
  };

  // ─── ÉTAPE 1 : Formulaire ────────────────────────────────────────────────
  if (step === "form") {
    return (
      <div className="animate-slide-up">
        <TopBar title="Cotiser" backTo="/home" backLabel="Accueil" />
        <div className="px-4 pb-6">

          {/* Group selector */}
          <label className="block text-xs font-medium text-muted-foreground mb-1.5">Groupe à cotiser</label>
          {groups.length === 0 ? (
            <div className="border border-border rounded-xl p-3 mb-4 text-center bg-card">
              <p className="text-xs text-muted-foreground">Vous n'êtes membre d'aucun groupe.</p>
              <button onClick={() => navigate("/rechercher")} className="text-xs text-[hsl(var(--tc-green))] font-semibold mt-1">Rejoindre un groupe →</button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mb-4">
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroup(g)}
                  className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                    selectedGroup?.id === g.id
                      ? "border-[hsl(var(--tc-green))] bg-[hsla(160,84%,39%,0.06)]"
                      : "border-border bg-card"
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm font-semibold">{g.name}</p>
                    <p className="text-[11px] text-[hsl(var(--tc-red))] font-medium">
                      {new Intl.NumberFormat("fr-FR").format(g.contribution_amount)} FCFA à cotiser
                    </p>
                  </div>
                  {selectedGroup?.id === g.id && (
                    <div className="w-5 h-5 rounded-full bg-[hsl(var(--tc-green))] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Phone input */}
          <PhoneInput
            label="Numéro mobile pour le paiement"
            value={phone}
            onChange={setPhone}
            placeholder="01 XX XX XX XX"
            className="mb-4"
          />

          {/* Operator */}
          <label className="block text-xs font-medium text-muted-foreground mb-2">Mode de paiement</label>
          <div className="grid grid-cols-4 gap-2 mb-5">
            {OPERATORS.map((op) => (
              <button
                key={op.id}
                onClick={() => setOperator(op.id)}
                className={`py-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                  operator === op.id
                    ? "border-[hsl(var(--tc-green))] text-[hsl(var(--tc-green))] bg-[hsla(160,84%,39%,0.06)]"
                    : "border-border text-muted-foreground bg-card"
                }`}
              >
                <div
                  className="w-7 h-7 rounded-lg mx-auto mb-1.5 flex items-center justify-center text-white text-[9px] font-bold"
                  style={{ background: op.color }}
                >
                  {op.shortName.charAt(0)}
                </div>
                {op.shortName}
              </button>
            ))}
          </div>

          {/* Summary */}
          {selectedGroup && (
            <div className="bg-[hsla(160,84%,39%,0.06)] border border-[hsla(160,84%,39%,0.2)] rounded-xl p-3 mb-5">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Cotisation</span>
                <span className="font-medium">{new Intl.NumberFormat("fr-FR").format(selectedGroup.contribution_amount)} FCFA</span>
              </div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-muted-foreground">Frais réseau</span>
                <span className="font-medium">{fees} FCFA</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-[hsla(160,84%,39%,0.2)] pt-2 mt-1">
                <span>Total</span>
                <span className="text-[hsl(var(--tc-green))]">{new Intl.NumberFormat("fr-FR").format(total)} FCFA</span>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              if (!selectedGroup) { toast.error("Sélectionnez un groupe"); return; }
              if (operator === "wallet") {
                if (total > (profile?.wallet_balance || 0)) { toast.error("Solde portefeuille insuffisant"); return; }
              } else {
                if (!phone || phone.replace(/\D/g, "").length < 8) { toast.error("Entrez un numéro valide"); return; }
              }
              setStep("confirm");
            }}
            disabled={!selectedGroup || (operator !== "wallet" && !phone)}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green disabled:opacity-40"
          >
            Continuer → {selectedGroup ? new Intl.NumberFormat("fr-FR").format(total) + " FCFA" : ""}
          </button>
        </div>
      </div>
    );
  }

  // ─── ÉTAPE 2 : Confirmation ───────────────────────────────────────────────
  if (step === "confirm") {
    const selectedOp = OPERATORS.find((o) => o.id === operator)!;
    return (
      <div className="animate-slide-up">
        <TopBar title="Confirmer le paiement" backTo="/cotiser" backLabel="Retour" />
        <div className="px-4 pb-6">
          <div className="text-center mb-6 pt-2">
            <p className="text-3xl font-bold text-[hsl(var(--tc-green))]">{new Intl.NumberFormat("fr-FR").format(total)}</p>
            <p className="text-sm text-muted-foreground">FCFA</p>
          </div>

          <div className="bg-card border border-border rounded-xl divide-y divide-border mb-5">
            <div className="flex justify-between px-4 py-3 text-sm">
              <span className="text-muted-foreground">Groupe</span>
              <span className="font-semibold">{selectedGroup?.name}</span>
            </div>
            {operator !== "wallet" && (
              <div className="flex justify-between px-4 py-3 text-sm">
                <span className="text-muted-foreground">Téléphone</span>
                <span className="font-semibold">{phone}</span>
              </div>
            )}
            <div className="flex justify-between px-4 py-3 text-sm">
              <span className="text-muted-foreground">Moyen</span>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded" style={{ background: selectedOp.color }} />
                <span className="font-semibold">{selectedOp.name}</span>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[hsla(38,92%,50%,0.08)] border border-[hsla(38,92%,50%,0.2)] mb-5 text-center">
            {operator === "wallet" ? (
              <p className="text-[11px] text-[hsl(var(--tc-amber))] font-medium">
                Le montant sera déduit immédiatement de votre portefeuille.
              </p>
            ) : (
              <p className="text-[11px] text-[hsl(var(--tc-amber))] font-medium">
                📲 Une notification sera envoyée sur <strong>{phone}</strong> pour valider le paiement
              </p>
            )}
          </div>

          <button
            onClick={handleConfirm}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white tc-gradient-green tc-shadow-green mb-3"
          >
            🔒 Confirmer le paiement
          </button>
          <button onClick={() => setStep("form")} className="w-full py-2.5 text-sm text-muted-foreground">
            ← Modifier
          </button>
        </div>
      </div>
    );
  }

  // ─── ÉTAPE 3 : Traitement en cours ───────────────────────────────────────
  if (step === "processing") {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center gap-5 animate-fade-in">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-[hsla(160,84%,39%,0.1)] flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-[hsl(var(--tc-green))] animate-spin" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-base font-bold mb-1">Traitement en cours...</p>
          <p className="text-xs text-muted-foreground">Connexion à TalyPay</p>
        </div>
        <div className="flex gap-1.5 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[hsl(var(--tc-green))]"
              style={{ animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ─── ÉTAPE 4 : Succès ────────────────────────────────────────────────────
  if (step === "done" && payResult) {
    const now = new Date().toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    return (
      <div className="flex flex-col min-h-screen animate-fade-in">
        <div className="flex-1 px-4 pt-10 text-center">
          <div className="w-20 h-20 rounded-full bg-[hsla(160,84%,39%,0.12)] flex items-center justify-center mx-auto mb-4 animate-check-bounce">
            <Check className="w-10 h-10 text-[hsl(var(--tc-green))]" strokeWidth={3} />
          </div>
          <h2 className="text-xl font-bold mb-1">Paiement initié !</h2>
          
          {(payResult.message?.includes("Test") || payResult.message?.includes("démo") || payResult.message?.includes("direct")) && (
            <div className="mb-4 inline-block px-3 py-1 bg-[hsla(45,35%,88%,0.9)] text-[hsl(35,25%,35%)] text-xs font-medium rounded-full border border-[hsla(35,20%,80%,0.8)]">
              Démo : flux fictif, aucun virement bancaire réel
            </div>
          )}
          
          <p className="text-xs text-muted-foreground mb-6">
            {operator === "wallet"
              ? "Montant prélevé sur votre portefeuille Tontine (pas de crédit supplémentaire)."
              : "Paiement direct : le solde de votre portefeuille Tontine ne change pas ; la cotisation va à la cagnotte du groupe."}
          </p>

          <div className="bg-card border border-border rounded-2xl p-4 text-left mb-4">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Reçu</p>
            {[
              ["Montant", `${new Intl.NumberFormat("fr-FR").format(total)} FCFA`],
              ["Groupe", selectedGroup?.name],
              ["Moyen", operator === "wallet" ? "Portefeuille" : phone],
              ["Date", now],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs mb-2">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-semibold">{v}</span>
              </div>
            ))}
            <div className="border-t border-border pt-2 mt-2">
              <p className="text-[10px] text-muted-foreground mb-0.5">Référence TalyPay</p>
              <p className="text-[11px] font-mono text-[hsl(var(--tc-purple))] break-all">
                {payResult.reference || "—"}
              </p>
            </div>
          </div>

          {operator !== "wallet" && (
            <div className="flex items-center gap-2 bg-[hsla(45,30%,94%,0.95)] border border-[hsla(35,18%,85%,0.7)] rounded-xl p-3 mb-6 text-left">
              <span aria-hidden>⏳</span>
              <p className="text-[11px] text-muted-foreground font-medium">
                Si vous payez par Mobile Money, validez la demande sur {phone}
              </p>
            </div>
          )}

          <button onClick={() => navigate("/home")} className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green mb-3">
            Retour à l'accueil
          </button>
          <button onClick={() => navigate("/historique")} className="text-xs text-[hsl(var(--tc-green))] font-medium">
            Voir l'historique →
          </button>
        </div>
      </div>
    );
  }

  // ─── ÉTAPE 5 : Erreur ────────────────────────────────────────────────────
  if (step === "error") {
    return (
      <div className="flex flex-col min-h-screen animate-fade-in">
        <div className="flex-1 px-4 pt-10 text-center">
          <div className="w-20 h-20 rounded-full bg-[hsla(0,84%,60%,0.12)] flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-xl font-bold mb-1">Paiement échoué</h2>
          <p className="text-xs text-muted-foreground mb-6">{payResult?.message || "Une erreur est survenue"}</p>
          <button onClick={() => setStep("form")} className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green mb-3">
            Réessayer
          </button>
          <button onClick={() => navigate("/home")} className="text-xs text-muted-foreground">Annuler</button>
        </div>
      </div>
    );
  }

  return null;
}
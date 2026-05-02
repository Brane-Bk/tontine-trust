import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { initPayment } from "@/lib/talypay";
import PhoneInput from "@/components/ui/PhoneInput";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Wallet, History, Loader2, Check } from "lucide-react";

export default function Portefeuille() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  
  const [tab, setTab] = useState<"historique" | "depot" | "retrait">("historique");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [operator, setOperator] = useState("MTN");
  const [step, setStep] = useState<"form" | "processing" | "success">("form");

  useEffect(() => {
    if (profile?.phone) setPhone(profile.phone);
  }, [profile]);

  const handleTransaction = async (type: "deposit" | "withdrawal") => {
    const amt = parseInt(amount);
    if (!amt || amt < 100) {
      toast.error("Montant invalide (min 100 FCFA)");
      return;
    }
    if (type === "withdrawal" && profile && amt > profile.wallet_balance) {
      toast.error("Solde insuffisant");
      return;
    }

    setStep("processing");

    if (type === "deposit") {
      // Dépôt : on utilise TalyPay (simulé en test)
      const res = await initPayment({
        amount: amt,
        customer_phone: phone,
        profile_id: user!.id,
        transaction_type: "deposit",
        transaction_name: "Rechargement Portefeuille",
        operator,
      });

      if (res.success) {
        await refreshProfile();
        setStep("success");
      } else {
        toast.error(res.message);
        setStep("form");
      }
    } else {
      // Retrait : on insère juste la demande de retrait qui devrait être validée par un admin
      // Pour la démo, le trigger le déduit automatiquement.
      await supabase.from("transactions").insert({
        profile_id: user!.id,
        type: "withdrawal",
        name: "Retrait vers Mobile Money",
        amount: -amt,
        talypay_status: "simulated_success",
        customer_phone: phone,
      });
      await refreshProfile();
      setStep("success");
    }
  };

  if (step === "processing") {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 text-[hsl(var(--tc-green))] animate-spin mb-4" />
        <p className="text-sm font-semibold">Traitement en cours...</p>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center px-6 text-center bg-background">
        <div className="w-20 h-20 rounded-full bg-[hsla(160,84%,39%,0.12)] flex items-center justify-center mb-6 animate-check-bounce">
          <Check className="w-10 h-10 text-[hsl(var(--tc-green))]" strokeWidth={3} />
        </div>
        <h2 className="text-2xl font-bold mb-2">Opération réussie !</h2>
        <p className="text-sm text-muted-foreground mb-8">Votre solde a été mis à jour.</p>
        <button onClick={() => { setStep("form"); setTab("historique"); }} className="w-full py-3.5 rounded-xl font-bold text-white tc-gradient-green">
          Retour au portefeuille
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <TopBar title="Mon Portefeuille" backTo="/home" />
      
      <div className="px-4 pt-4">
        {/* Card Solde */}
        <div className="bg-gradient-to-br from-[hsl(var(--tc-green))] to-[hsl(160,84%,25%)] rounded-2xl p-5 text-white shadow-xl mb-6 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl"></div>
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-5 h-5 opacity-80" />
            <p className="text-sm font-medium opacity-90">Solde Disponible</p>
          </div>
          <p className="text-4xl font-bold mb-1">
            {new Intl.NumberFormat("fr-FR").format(profile?.wallet_balance || 0)} <span className="text-xl font-medium opacity-80">FCFA</span>
          </p>
          <p className="text-xs opacity-80 mt-4">Mis à jour à l'instant</p>
        </div>

        {/* Actions Tabs */}
        <div className="flex bg-card border border-border p-1 rounded-xl mb-6">
          <button onClick={() => setTab("historique")} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tab === "historique" ? "bg-background shadow text-foreground" : "text-muted-foreground"}`}>
            Historique
          </button>
          <button onClick={() => setTab("depot")} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tab === "depot" ? "bg-background shadow text-[hsl(var(--tc-green))]" : "text-muted-foreground"}`}>
            Déposer
          </button>
          <button onClick={() => setTab("retrait")} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tab === "retrait" ? "bg-background shadow text-[hsl(var(--tc-amber))]" : "text-muted-foreground"}`}>
            Retirer
          </button>
        </div>

        {tab === "historique" && (
          <div className="text-center py-10">
            <History className="w-10 h-10 mx-auto text-muted mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">Aucune transaction pour le moment.</p>
          </div>
        )}

        {tab !== "historique" && (
          <div className="animate-fade-in space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Montant (FCFA)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 5000"
                className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-lg font-bold outline-none focus:border-[hsl(var(--tc-green))] transition-colors"
              />
            </div>

            <PhoneInput label="Numéro Mobile Money" value={phone} onChange={setPhone} placeholder="01 XX XX XX XX" />
            
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-2">Opérateur</label>
              <div className="flex gap-2">
                {["MTN", "MOOV", "CELTIIS"].map(op => (
                  <button key={op} onClick={() => setOperator(op)} className={`flex-1 py-2 text-xs font-bold rounded-xl border-2 ${operator === op ? "border-[hsl(var(--tc-green))] bg-[hsla(160,84%,39%,0.06)] text-[hsl(var(--tc-green))]" : "border-border bg-card text-muted-foreground"}`}>
                    {op}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleTransaction(tab)}
              className="w-full py-4 mt-4 rounded-xl text-sm font-bold text-white tc-gradient-green tc-shadow-green flex items-center justify-center gap-2"
            >
              {tab === "depot" ? <><ArrowDownLeft className="w-5 h-5" /> Confirmer le dépôt</> : <><ArrowUpRight className="w-5 h-5" /> Confirmer le retrait</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

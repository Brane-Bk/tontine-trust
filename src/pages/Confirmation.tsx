import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";

export default function Confirmation() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <div className="flex-1 px-4 pt-12 text-center">
        {/* Animated check */}
        <div className="w-16 h-16 rounded-full bg-[hsla(160,84%,39%,0.12)] flex items-center justify-center mx-auto mb-4 animate-check-bounce">
          <Check className="w-8 h-8 text-[hsl(var(--tc-green))]" strokeWidth={3} />
        </div>

        <h2 className="text-xl font-bold mb-1">Cotisation envoyée !</h2>
        <p className="text-xs text-muted-foreground mb-6">Votre paiement est confirmé en blockchain</p>

        {/* Receipt */}
        <div className="bg-card border border-border rounded-2xl p-4 text-left mb-4">
          <div className="flex justify-between text-xs mb-2"><span className="text-muted-foreground">Montant</span><span className="font-semibold">50 020 FCFA</span></div>
          <div className="flex justify-between text-xs mb-2"><span className="text-muted-foreground">Groupe</span><span className="font-semibold">Marché Dantokpa</span></div>
          <div className="flex justify-between text-xs mb-2"><span className="text-muted-foreground">Via</span><span className="font-semibold">MTN MoMo</span></div>
          <div className="flex justify-between text-xs mb-2"><span className="text-muted-foreground">Date</span><span className="font-semibold">16 avr 2026 · 14:32</span></div>
          <div className="border-t border-border pt-2 mt-1">
            <p className="text-[10px] text-muted-foreground mb-1">Transaction hash</p>
            <p className="text-[11px] text-[hsl(var(--tc-purple))] font-semibold break-all">
              0x9f2c84a3b1e7d5c0f69238a4bbe81c92da8e1903
            </p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button className="flex-1 py-2.5 rounded-xl bg-[hsla(258,90%,66%,0.12)] text-[hsl(var(--tc-purple))] text-[11px] font-semibold">
            Voir sur blockchain
          </button>
          <button className="flex-1 py-2.5 rounded-xl bg-card border border-border text-[11px] font-medium text-muted-foreground">
            Partager
          </button>
        </div>

        <button
          onClick={() => navigate("/home")}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green"
        >
          Retour à l'accueil
        </button>
      </div>
    </div>
  );
}
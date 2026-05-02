import { useNavigate, useLocation } from "react-router-dom";
import { Check } from "lucide-react";

interface PaymentState {
  amount?: number;
  groupName?: string;
  phone?: string;
  operator?: string;
  reference?: string;
  type?: string;
}

const OPERATOR_NAMES: Record<string, string> = {
  mtn: "MTN MoMo",
  moov: "Moov Money",
  celtiis: "Celtiis Cash",
};

export default function Confirmation() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as PaymentState) || {};

  const {
    amount = 0,
    groupName = "—",
    phone = "—",
    operator = "mtn",
    reference = "TT-" + Date.now(),
    type = "Cotisation",
  } = state;

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex flex-col min-h-screen animate-fade-in">
      <div className="flex-1 px-4 pt-12 text-center">
        {/* Animated check */}
        <div className="w-20 h-20 rounded-full bg-[hsla(160,84%,39%,0.12)] flex items-center justify-center mx-auto mb-4 animate-check-bounce">
          <Check className="w-10 h-10 text-[hsl(var(--tc-green))]" strokeWidth={3} />
        </div>

        <h2 className="text-xl font-bold mb-1">Paiement initié !</h2>
        <p className="text-xs text-muted-foreground mb-6">
          Vérifiez votre téléphone et validez la demande de paiement
        </p>

        {/* Receipt */}
        <div className="bg-card border border-border rounded-2xl p-4 text-left mb-4">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Reçu de paiement</p>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Type</span>
            <span className="font-semibold">{type}</span>
          </div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Montant</span>
            <span className="font-semibold text-[hsl(var(--tc-green))]">
              {new Intl.NumberFormat("fr-FR").format(amount)} FCFA
            </span>
          </div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Groupe</span>
            <span className="font-semibold">{groupName}</span>
          </div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Opérateur</span>
            <span className="font-semibold">{OPERATOR_NAMES[operator] || operator}</span>
          </div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Téléphone</span>
            <span className="font-semibold">{phone}</span>
          </div>
          <div className="flex justify-between text-xs mb-2">
            <span className="text-muted-foreground">Date</span>
            <span className="font-semibold">{dateStr}</span>
          </div>
          <div className="border-t border-border pt-2 mt-1">
            <p className="text-[10px] text-muted-foreground mb-1">Référence TalyPay</p>
            <p className="text-[11px] text-[hsl(var(--tc-purple))] font-semibold break-all">
              {reference}
            </p>
          </div>
        </div>

        {/* Status banner */}
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[hsla(38,92%,50%,0.08)] border border-[hsla(38,92%,50%,0.15)] mb-4 text-left">
          <span className="text-lg">⏳</span>
          <div>
            <p className="text-[11px] font-semibold text-[hsl(var(--tc-amber))]">En attente de confirmation</p>
            <p className="text-[10px] text-muted-foreground">
              Validez la demande sur votre téléphone — le paiement sera confirmé automatiquement
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/home")}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green"
        >
          Retour à l'accueil
        </button>
        <button
          onClick={() => navigate("/historique")}
          className="mt-3 text-xs text-[hsl(var(--tc-green))] font-medium"
        >
          Voir l'historique →
        </button>
      </div>
    </div>
  );
}
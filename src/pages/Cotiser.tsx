import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import { Check } from "lucide-react";

const paymentMethods = [
  { id: "mtn", name: "MTN MoMo", sub: "+229 01 02 03 04 05", color: "hsl(38, 92%, 50%)" },
  { id: "moov", name: "Moov Money", sub: "+229 01 06 07 08 09", color: "hsl(217, 91%, 40%)" },
  { id: "celtiis", name: "Celtiis Cash", sub: "+229 01 10 11 12 13", color: "hsl(16, 100%, 50%)" },
];

export default function Cotiser() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("mtn");

  return (
    <div className="animate-slide-up">
      <TopBar title="Cotiser" backTo="/home" backLabel="Groupe" />
      <div className="px-4 pb-6">
        {/* Selected group */}
        <div className="bg-card border border-border rounded-xl p-3 mb-4">
          <p className="text-[11px] text-muted-foreground mb-1">Groupe sélectionné</p>
          <p className="text-base font-bold">Marché Dantokpa</p>
          <p className="text-[11px] text-muted-foreground">
            Cotisation due : <strong className="text-[hsl(var(--tc-red))]">50 000 FCFA</strong>
          </p>
        </div>

        {/* Payment methods */}
        <label className="block text-xs font-medium text-muted-foreground mb-2">Moyen de paiement</label>
        <div className="flex flex-col gap-2 mb-4">
          {paymentMethods.map((pm) => (
            <button
              key={pm.id}
              onClick={() => setSelected(pm.id)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                selected === pm.id
                  ? "border-[hsl(var(--tc-green))] bg-[hsla(160,84%,39%,0.05)]"
                  : "border-border bg-card"
              }`}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: pm.color }}>
                {pm.name.charAt(0)}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold">{pm.name}</p>
                <p className="text-[11px] text-muted-foreground">{pm.sub}</p>
              </div>
              {selected === pm.id && (
                <div className="w-5 h-5 rounded-full bg-[hsl(var(--tc-green))] flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-card border border-border rounded-xl p-3 mb-4">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Cotisation</span><span>50 000 FCFA</span>
          </div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Frais réseau</span><span>20 FCFA</span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t border-border pt-2 mt-1">
            <span>Total</span><span className="text-[hsl(var(--tc-green))]">50 020 FCFA</span>
          </div>
        </div>

        <button
          onClick={() => navigate("/confirmation")}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green mb-2"
        >
          Confirmer avec PIN →
        </button>
        <p className="text-[10px] text-muted-foreground text-center flex items-center justify-center gap-1">
          🔒 Paiement sécurisé · confirmé en blockchain
        </p>
      </div>
    </div>
  );
}
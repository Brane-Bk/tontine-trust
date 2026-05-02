import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";

export default function Connexion() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");

  const handleLogin = () => {
    navigate("/home");
  };

  return (
    <div className="flex flex-col min-h-screen animate-slide-up">
      <TopBar title="Connexion" backTo="/" backLabel="Retour" />
      <div className="flex-1 px-4 pt-4">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl tc-gradient-green flex items-center justify-center mx-auto mb-4 tc-shadow-green">
            <span className="text-white text-xl">🔐</span>
          </div>
          <h2 className="text-lg font-bold">Bon retour !</h2>
          <p className="text-xs text-muted-foreground mt-1">Connectez-vous avec votre téléphone</p>
        </div>

        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Numéro de téléphone</label>
        <div className="flex gap-2 mb-4">
          <div className="px-3 py-2.5 rounded-xl border border-border bg-card text-sm shrink-0">🇧🇯 +229</div>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01 02 03 04 05"
            className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))] transition-colors"
          />
        </div>

        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Code PIN</label>
        <div className="flex gap-2 justify-center mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-bold transition-colors ${
                pin.length > i
                  ? "border-[hsl(var(--tc-green))] bg-[hsla(160,84%,39%,0.08)]"
                  : "border-border bg-card"
              }`}
            >
              {pin.length > i ? "•" : ""}
            </div>
          ))}
        </div>
        <input
          type="number"
          value={pin}
          onChange={(e) => setPin(e.target.value.slice(0, 4))}
          className="sr-only"
          autoFocus
        />

        <button
          onClick={handleLogin}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green mb-3"
        >
          Se connecter
        </button>

        <div className="flex items-center gap-2 justify-center">
          <div className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-sm">👆</div>
          <span className="text-xs text-muted-foreground">ou utiliser la biométrie</span>
        </div>

        <p className="text-center mt-6">
          <button onClick={() => navigate("/inscription")} className="text-xs text-[hsl(var(--tc-green))] font-medium">
            Pas de compte ? Créer →
          </button>
        </p>
      </div>
    </div>
  );
}
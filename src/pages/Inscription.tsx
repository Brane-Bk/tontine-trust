import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";

export default function Inscription() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  return (
    <div className="flex flex-col min-h-screen animate-slide-up">
      <TopBar
        title="Créer un compte"
        backTo="/"
        backLabel="Retour"
        rightElement={<span className="text-xs text-[hsl(var(--tc-green))] font-semibold">Étape {step}/3</span>}
      />
      <div className="px-4 pt-2">
        <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-6">
          <div className="h-full rounded-full bg-[hsl(var(--tc-green))] transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
        </div>

        {step === 1 && (
          <div className="animate-slide-up">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nom complet</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ama Kossou"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))] transition-colors mb-4"
            />
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Téléphone</label>
            <div className="flex gap-2 mb-6">
              <div className="px-3 py-2.5 rounded-xl border border-border bg-card text-sm shrink-0">🇧🇯 +229</div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01 02 03 04 05"
                className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))] transition-colors"
              />
            </div>
            <button onClick={() => setStep(2)} className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green">
              Recevoir le code OTP →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up">
            <p className="text-center text-sm text-muted-foreground mb-6">Code envoyé au +229 {phone || "01 02 03 04 05"}</p>
            <div className="flex gap-3 justify-center mb-6">
              {[1, 4, 7, 2].map((n, i) => (
                <div key={i} className="w-12 h-12 rounded-xl border-2 border-[hsl(var(--tc-green))] bg-[hsla(160,84%,39%,0.08)] flex items-center justify-center text-lg font-bold">
                  {n}
                </div>
              ))}
            </div>
            <button onClick={() => setStep(3)} className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green">
              Vérifier →
            </button>
            <p className="text-center text-xs text-muted-foreground mt-4">Renvoyer le code dans 45s</p>
          </div>
        )}

        {step === 3 && (
          <div className="animate-slide-up">
            <p className="text-center text-sm mb-6">Créez votre code PIN à 4 chiffres</p>
            <div className="flex gap-3 justify-center mb-6">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="w-12 h-12 rounded-xl border-2 border-[hsl(var(--tc-green))] bg-[hsla(160,84%,39%,0.08)] flex items-center justify-center text-lg font-bold">
                  •
                </div>
              ))}
            </div>
            <button onClick={() => navigate("/home")} className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green">
              Créer mon identité décentralisée →
            </button>
            <div className="mt-4 p-3 rounded-xl bg-[hsla(258,90%,66%,0.08)] border border-[hsla(258,90%,66%,0.15)]">
              <p className="text-[10px] text-[hsl(var(--tc-purple))] font-semibold mb-1">🔑 Identité DID créée</p>
              <p className="text-[10px] text-muted-foreground">did:celo:0x4b2e...d91a — stocké localement, vous seul y avez accès</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
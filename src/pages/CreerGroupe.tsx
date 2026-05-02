import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import ProgressBar from "@/components/ui/ProgressBar";

export default function CreerGroupe() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    frequency: "Mensuelle",
    maxMembers: "12",
    order: "vrf",
    penalty: "5",
    guarantee: "",
  });

  return (
    <div className="animate-slide-up">
      <TopBar
        title="Créer un groupe"
        backTo="/home"
        backLabel="Accueil"
        rightElement={<span className="text-xs text-[hsl(var(--tc-green))] font-semibold">Étape {step}/3</span>}
      />
      <div className="px-4">
        <ProgressBar value={(step / 3) * 100} className="mb-5" />

        {step === 1 && (
          <div className="animate-slide-up flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nom du groupe</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Tontine Zémidjan Cotonou"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Montant de cotisation</label>
              <div className="flex gap-2">
                <input
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="50 000"
                  className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))]"
                />
                <div className="px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-muted-foreground">FCFA</div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Fréquence</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none"
              >
                <option>Mensuelle</option>
                <option>Hebdomadaire</option>
                <option>Bi-mensuelle</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nombre de membres max</label>
              <input
                value={form.maxMembers}
                onChange={(e) => setForm({ ...form, maxMembers: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))]"
              />
            </div>
            <button onClick={() => setStep(2)} className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green">
              Suivant →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Ordre de passage</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setForm({ ...form, order: "vrf" })}
                  className={`flex-1 py-2.5 rounded-xl text-[11px] font-semibold text-center border-2 transition-colors ${
                    form.order === "vrf"
                      ? "border-[hsl(var(--tc-green))] text-[hsl(var(--tc-green))] bg-[hsla(160,84%,39%,0.08)]"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  Aléatoire (VRF)
                </button>
                <button
                  onClick={() => setForm({ ...form, order: "manual" })}
                  className={`flex-1 py-2.5 rounded-xl text-[11px] font-semibold text-center border-2 transition-colors ${
                    form.order === "manual"
                      ? "border-[hsl(var(--tc-green))] text-[hsl(var(--tc-green))] bg-[hsla(160,84%,39%,0.08)]"
                      : "border-border text-muted-foreground"
                  }`}
                >
                  Tirage manuel
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Pénalité de retard (%)</label>
              <input
                value={form.penalty}
                onChange={(e) => setForm({ ...form, penalty: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Dépôt de garantie (FCFA)</label>
              <input
                value={form.guarantee}
                onChange={(e) => setForm({ ...form, guarantee: e.target.value })}
                placeholder="Montant de la caution obligatoire"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))]"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Chaque membre devra déposer cette caution avant de rejoindre le groupe
              </p>
            </div>
            <button onClick={() => setStep(3)} className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green">
              Suivant →
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="animate-slide-up flex flex-col gap-4">
            <p className="text-sm text-center text-muted-foreground mb-2">Invitez vos premiers membres</p>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Téléphone du membre</label>
              <div className="flex gap-2">
                <input
                  placeholder="+229 01 XX XX XX XX"
                  className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))]"
                />
                <button className="px-4 py-2.5 rounded-xl bg-[hsla(160,84%,39%,0.12)] text-[hsl(var(--tc-green))] text-sm font-semibold">
                  Inviter
                </button>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-card border border-border">
              <p className="text-xs font-semibold mb-2">Récapitulatif</p>
              <div className="flex flex-col gap-1 text-[11px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Nom</span><span>{form.name || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cotisation</span><span>{form.amount || "—"} FCFA</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Fréquence</span><span>{form.frequency}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Membres max</span><span>{form.maxMembers}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Ordre</span><span>{form.order === "vrf" ? "Aléatoire (VRF)" : "Manuel"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Pénalité</span><span>{form.penalty}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Garantie</span><span className="font-semibold text-[hsl(var(--tc-amber))]">{form.guarantee || "—"} FCFA</span></div>
              </div>
            </div>
            <button
              onClick={() => navigate("/home")}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green"
            >
              Déployer le contrat →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
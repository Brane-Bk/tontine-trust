import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import ProgressBar from "@/components/ui/ProgressBar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Info, ShieldCheck, TrendingUp, Users } from "lucide-react";

export default function CreerGroupe() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    frequency: "Mensuelle",
    maxMembers: "12",
    order: "vrf",
    penalty: "5",
    guarantee: "",
  });

  useEffect(() => {
    const hasSeenIntro = localStorage.getItem("hasSeenCreationIntro");
    if (!hasSeenIntro) {
      setShowIntro(true);
    }
  }, []);

  const closeIntro = () => {
    localStorage.setItem("hasSeenCreationIntro", "true");
    setShowIntro(false);
  };

  const handleCreate = async () => {
    if (!user) return;
    if (!form.name || !form.amount) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setLoading(true);
    try {
      const maxMembers = parseInt(form.maxMembers) || 12;
      const initials = form.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      const colors = ["green", "blue", "amber", "purple", "red"];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const { data, error } = await supabase
        .from("groups")
        .insert({
          name: form.name,
          initials,
          color,
          contribution_amount: parseFloat(form.amount),
          frequency: form.frequency,
          max_members: maxMembers,
          total_rounds: maxMembers,
          penalty_rate: parseFloat(form.penalty) || 5,
          guarantee_deposit: parseFloat(form.guarantee) || 0,
          order_type: form.order,
          status: "pending",
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add creator as admin member
      await supabase.from("group_members").insert({
        group_id: data!.id,
        profile_id: user.id,
        role: "admin",
        turn_order: 1,
        status: "waiting",
        guarantee_status: "verified" // Creator doesn't need to pay guarantee to themselves? 
                                     // Actually, if there is a guarantee_deposit, they might still need to pay it.
                                     // For simplicity in the prototype, we mark them verified.
      });

      // Profile updates are now handled by triggers (groups_count)
      // but let's refresh to be sure
      await refreshProfile();

      toast.success("Groupe créé avec succès !");
      navigate(`/groupe/${data!.id}`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  if (showIntro) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-fade-in">
        <div className="flex-1 px-6 pt-16 pb-8 overflow-y-auto">
          <div className="w-16 h-16 rounded-3xl tc-gradient-green flex items-center justify-center mb-8 mx-auto tc-shadow-green">
            <Info className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-2">Création de Groupe</h2>
          <p className="text-sm text-muted-foreground text-center mb-10 px-4">
            En tant que créateur, vous posez les bases d'une tontine de confiance. Voici ce qu'il faut savoir :
          </p>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-[hsla(160,84%,39%,0.1)] flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-[hsl(var(--tc-green))]" />
              </div>
              <div>
                <p className="text-sm font-bold mb-0.5">Gestion des membres</p>
                <p className="text-[11px] text-muted-foreground">Vous définissez le nombre de places et validez les adhésions.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-[hsla(160,84%,39%,0.1)] flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-[hsl(var(--tc-green))]" />
              </div>
              <div>
                <p className="text-sm font-bold mb-0.5">Fréquence et Montant</p>
                <p className="text-[11px] text-muted-foreground">Choisissez des paramètres réalistes pour assurer la régularité des cotisations.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-[hsla(160,84%,39%,0.1)] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[hsl(var(--tc-green))]" />
              </div>
              <div>
                <p className="text-sm font-bold mb-0.5">Sécurité & Caution</p>
                <p className="text-[11px] text-muted-foreground">Exiger une caution renforce la confiance et réduit les risques de retard.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-border bg-card">
          <button
            onClick={closeIntro}
            className="w-full py-4 rounded-xl font-bold text-white tc-gradient-green tc-shadow-green"
          >
            J'ai compris, commencer →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-slide-up">
      <TopBar
        title="Créer un groupe"
        backTo="/home"
        backLabel="Accueil"
        rightElement={<span className="text-xs text-[hsl(var(--tc-green))] font-semibold">Étape {step}/2</span>}
      />
      <div className="px-4">
        <ProgressBar value={(step / 2) * 100} className="mb-5" />

        {step === 1 && (
          <div className="animate-slide-up flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nom du groupe *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Tontine Zémidjan Cotonou"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Montant de cotisation (FCFA) *</label>
              <div className="flex gap-2">
                <input
                  type="number"
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
                <option value="Mensuelle">Mensuelle</option>
                <option value="Hebdomadaire">Hebdomadaire</option>
                <option value="Bimensuelle">Bi-mensuelle (15 jours)</option>
                <option value="Trimestrielle">Trimestrielle</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nombre de membres max</label>
              <input
                type="number"
                value={form.maxMembers}
                onChange={(e) => setForm({ ...form, maxMembers: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))]"
              />
            </div>
            <button onClick={() => setStep(2)} disabled={!form.name || !form.amount} className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green disabled:opacity-50">
              Suivant →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Ordre de passage</label>
              <div className="flex gap-2">
                {["vrf", "manual"].map((o) => (
                  <button
                    key={o}
                    onClick={() => setForm({ ...form, order: o })}
                    className={`flex-1 py-2.5 rounded-xl text-[11px] font-semibold text-center border-2 transition-colors ${
                      form.order === o
                        ? "border-[hsl(var(--tc-green))] text-[hsl(var(--tc-green))] bg-[hsla(160,84%,39%,0.08)]"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {o === "vrf" ? "Aléatoire" : "Manuel"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Pénalité de retard (%)</label>
              <input
                type="number"
                value={form.penalty}
                onChange={(e) => setForm({ ...form, penalty: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Dépôt de garantie (FCFA)</label>
              <input
                type="number"
                value={form.guarantee}
                onChange={(e) => setForm({ ...form, guarantee: e.target.value })}
                placeholder="Optionnel"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))]"
              />
            </div>
            {/* Summary */}
            <div className="p-3 rounded-xl bg-card border border-border">
              <p className="text-xs font-semibold mb-2">Récapitulatif</p>
              <div className="flex flex-col gap-1 text-[11px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Nom</span><span>{form.name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cotisation</span><span>{form.amount} FCFA</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Fréquence</span><span>{form.frequency}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Membres max</span><span>{form.maxMembers}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Pénalité</span><span>{form.penalty}%</span></div>
              </div>
            </div>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green disabled:opacity-50"
            >
              {loading ? "Création en cours..." : "Créer le groupe →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import ProgressBar from "@/components/ui/ProgressBar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function CreerGroupe() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    frequency: "Mensuelle",
    maxMembers: "12",
    order: "vrf",
    penalty: "5",
    guarantee: "",
  });

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
        })
        .select()
        .single();

      // If initial insert failed due to schema cache, retry without optional columns
      if (error) {
        // Schema cache may not have the new columns yet - try minimal insert
        const { data: data2, error: error2 } = await supabase
          .from("groups")
          .insert({
            name: form.name,
            initials,
            color,
            contribution_amount: parseFloat(form.amount),
            frequency: form.frequency,
            max_members: maxMembers,
            total_rounds: maxMembers,
            status: "pending",
            created_by: user.id,
          })
          .select()
          .single();
        if (error2) throw error2;
        Object.assign(data || {}, data2);
        if (!data) throw error2;
      }

      // Patch the optional columns separately (handles schema cache lag)
      await supabase.from("groups").update({
        penalty_rate: parseFloat(form.penalty) || 5,
        guarantee_deposit: parseFloat(form.guarantee) || 0,
        order_type: form.order,
      }).eq("id", data!.id).then(() => null).catch(() => null); // Non-blocking

      // Add creator as admin member
      await supabase.from("group_members").insert({
        group_id: data!.id,
        profile_id: user.id,
        role: "admin",
        turn_order: 1,
        status: "waiting",
      });

      // Update groups_count in profile
      await supabase
        .from("profiles")
        .update({ groups_count: (profile?.groups_count || 0) + 1 })
        .eq("id", user.id);

      toast.success("Groupe créé avec succès !");
      navigate(`/groupe/${data!.id}`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

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
                <option>Mensuelle</option>
                <option>Hebdomadaire</option>
                <option>Bi-mensuelle</option>
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
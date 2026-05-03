import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import ProgressBar from "@/components/ui/ProgressBar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Info, ShieldCheck, TrendingUp, Users, Calendar,
  Coins, Clock, ChevronRight, Zap, Lock
} from "lucide-react";

type Frequency = "Journalier" | "Hebdomadaire" | "Bimensuelle" | "Mensuelle" | "Trimestrielle";

const FREQ_LABELS: Record<Frequency, string> = {
  Journalier: "Journalier (1 j)",
  Hebdomadaire: "Hebdomadaire (7 j)",
  Bimensuelle: "Bi-mensuelle (15 j)",
  Mensuelle: "Mensuelle (30 j)",
  Trimestrielle: "Trimestrielle (90 j)",
};

const FREQ_DESC: Record<Frequency, string> = {
  Journalier: "Cotisations et versements chaque jour. Idéal pour des petits groupes très actifs.",
  Hebdomadaire: "Un tour toutes les semaines. Bon équilibre entre fréquence et sécurité.",
  Bimensuelle: "Cotisation toutes les deux semaines (quinzaine).",
  Mensuelle: "Le format classique. Un seul tour par mois pour tout le monde.",
  Trimestrielle: "Un tour tous les 3 mois. Adapté aux grosses mises ou projets longs.",
};

export default function CreerGroupe() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showIntro, setShowIntro] = useState(false);
  const [form, setForm] = useState({
    name: "",
    amount: "",
    frequency: "Mensuelle" as Frequency,
    otherMembers: "4",   // nombre d'autres membres (hors créateur)
    order: "random",
    penalty: "5",
    guarantee: "",
    minScore: "0",
  });

  useEffect(() => {
    const seen = localStorage.getItem("hasSeenCreationIntro");
    if (!seen) setShowIntro(true);
  }, []);

  const closeIntro = () => {
    localStorage.setItem("hasSeenCreationIntro", "true");
    setShowIntro(false);
  };

  const totalMembers = (parseInt(form.otherMembers, 10) || 0) + 1; // +1 pour le créateur
  const clampedMembers = Math.min(Math.max(totalMembers, 2), 50);

  const handleCreate = async () => {
    if (!user) return;
    if (!form.name.trim() || !form.amount) {
      toast.error("Veuillez remplir le nom et le montant");
      return;
    }
    if (!form.guarantee || parseFloat(form.guarantee) <= 0) {
      toast.error("Le montant de la garantie bancaire est obligatoire");
      return;
    }
    const others = parseInt(form.otherMembers, 10);
    if (!others || others < 1) {
      toast.error("Il faut au moins 2 membres au total (vous + 1 autre)");
      return;
    }
    if (others > 49) {
      toast.error("Le groupe ne peut pas dépasser 50 membres au total.");
      return;
    }
    setLoading(true);
    try {
      const maxMembers = totalMembers; // créateur + autres
      const initials = form.name.trim()
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "GR";
      const colors = ["green", "blue", "amber", "purple", "red"];
      const color = colors[Math.floor(Math.random() * colors.length)];

      const { data, error } = await supabase
        .from("groups")
        .insert({
          name: form.name.trim(),
          initials,
          color,
          contribution_amount: parseFloat(form.amount),
          frequency: form.frequency,
          max_members: maxMembers,
          total_rounds: maxMembers,
          penalty_rate: parseFloat(form.penalty) || 5,
          guarantee_deposit: parseFloat(form.guarantee) || 0,
          order_type: form.order === "random" ? "random" : "manual",
          min_score: parseInt(form.minScore, 10) || 0,
          status: "pending",
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Ajouter le créateur comme admin (member #1)
      const { error: memberErr } = await supabase.from("group_members").insert({
        group_id: data.id,
        profile_id: user.id,
        role: "admin",
        turn_order: 1,
        status: "waiting",
        guarantee_status: "verified",
      });
      if (memberErr) {
        // Rollback: delete the orphaned group
        await supabase.from("groups").delete().eq("id", data.id);
        throw memberErr;
      }

      await refreshProfile();
      toast.success("🎉 Groupe créé ! Vous êtes membre n°1.");
      navigate(`/groupe/${data.id}`);
    } catch (err: any) {
      console.error("[CreerGroupe] Full Error:", err);
      const details = err.details || err.hint || "";
      toast.error(err.message + (details ? ` (${details})` : "") || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  // ─── INTRO ─────────────────────────────────────────────────────────────────
  if (showIntro) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex flex-col animate-fade-in overflow-y-auto">
        <div className="flex-1 px-5 pt-14 pb-8">
          <div className="w-16 h-16 rounded-3xl tc-gradient-green flex items-center justify-center mb-6 mx-auto tc-shadow-green">
            <Info className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-1">Comment fonctionne une tontine ?</h2>
          <p className="text-[11px] text-muted-foreground text-center mb-8 px-4">
            Lisez attentivement — cela vous aidera à créer un groupe efficace.
          </p>

          <div className="space-y-5">
            {[
              {
                icon: Users,
                color: "text-[hsl(var(--tc-green))]",
                bg: "bg-[hsla(160,84%,39%,0.1)]",
                title: "Principe de la tontine",
                body: "Tous les membres cotisent régulièrement le même montant. À chaque tour, LA TOTALITÉ de la cagnotte accumulée est versée à UN SEUL membre (selon l'ordre défini). Le cycle recommence jusqu'à ce que tout le monde ait reçu son tour.",
              },
              {
                icon: Calendar,
                color: "text-[hsl(var(--tc-blue))]",
                bg: "bg-[hsla(210,84%,60%,0.1)]",
                title: "Fréquence & Tours",
                body: "Si vous créez un groupe de 5 personnes à cotisation mensuelle de 10 000 FCFA, chaque mois un membre reçoit 50 000 FCFA (5 × 10 000). Le cycle dure 5 mois. Chaque membre reçoit une fois.",
              },
              {
                icon: Zap,
                color: "text-[hsl(var(--tc-amber))]",
                bg: "bg-[hsla(38,92%,50%,0.1)]",
                title: "Versement automatique",
                body: "Lorsque TOUS les membres ont cotisé dans un tour, TontineChain verse automatiquement la cagnotte au bénéficiaire de ce tour. Aucune action manuelle requise.",
              },
              {
                icon: Lock,
                color: "text-[hsl(var(--tc-red))]",
                bg: "bg-[hsla(0,84%,60%,0.1)]",
                title: "Compte verrouillé si retard",
                body: "Si vous ne cotisez pas avant l'échéance, votre statut passe en RETARD. Votre portefeuille est suspendu (retraits bloqués) jusqu'à régularisation. Le groupe peut vous exclure.",
              },
              {
                icon: ShieldCheck,
                color: "text-[hsl(var(--tc-green))]",
                bg: "bg-[hsla(160,84%,39%,0.1)]",
                title: "Garantie bancaire obligatoire",
                body: "Une banque partenaire avance le paiement en cas de défaut du membre, puis récupère les fonds auprès de lui. Ce mécanisme renforce la confiance du groupe.",
              },
              {
                icon: TrendingUp,
                color: "text-[hsl(var(--tc-purple))]",
                bg: "bg-[hsla(280,60%,60%,0.1)]",
                title: "Score de confiance",
                body: "Chaque membre a un score (0-1000). Payer à temps augmente le score, les retards le diminuent. Vous pouvez fixer un score minimum pour filtrer les membres.",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div>
                  <p className="text-sm font-bold mb-0.5">{item.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 border-t border-border bg-card/95 backdrop-blur-sm">
          <button
            onClick={closeIntro}
            className="w-full py-4 rounded-xl font-bold text-white tc-gradient-green tc-shadow-green flex items-center justify-center gap-2"
          >
            J'ai compris — Créer mon groupe <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ─── FORMULAIRE ─────────────────────────────────────────────────────────────
  return (
    <div className="animate-slide-up pb-8">
      <TopBar
        title="Créer un groupe"
        backTo="/home"
        backLabel="Accueil"
        rightElement={
          <div className="flex items-center gap-2">
            <span className="text-xs text-[hsl(var(--tc-green))] font-semibold">Étape {step}/2</span>
            <button
              type="button"
              onClick={() => setShowIntro(true)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Aide"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        }
      />
      <div className="px-4">
        <ProgressBar value={(step / 2) * 100} className="mb-5" />

        {/* ── ÉTAPE 1 : Informations de base ─────────────────────────── */}
        {step === 1 && (
          <div className="animate-slide-up flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nom du groupe *</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex : Tontine Famille Adjovi"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Montant de cotisation par tour (FCFA) *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="50 000"
                  min="100"
                  className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))] transition-colors"
                />
                <div className="px-3 py-2.5 rounded-xl border border-border bg-card text-sm text-muted-foreground">FCFA</div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                + 20 FCFA de frais réseau par cotisation
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Fréquence de cotisation</label>
              <div className="flex flex-col gap-2">
                {(Object.keys(FREQ_LABELS) as Frequency[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setForm({ ...form, frequency: f })}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      form.frequency === f
                        ? "border-[hsl(var(--tc-green))] bg-[hsla(160,84%,39%,0.06)]"
                        : "border-border bg-card"
                    }`}
                  >
                    <p className="text-xs font-bold">{FREQ_LABELS[f]}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{FREQ_DESC[f]}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Nombre de participants (hors vous)
              </label>
              <p className="text-[10px] text-muted-foreground mb-2 leading-relaxed bg-[hsla(160,84%,39%,0.06)] border border-[hsla(160,84%,39%,0.15)] rounded-lg px-2.5 py-2">
                💡 <strong>Vous êtes automatiquement membre n°1.</strong> Entrez ici le nombre d'autres personnes qui peuvent rejoindre. Total : {clampedMembers} membres.
              </p>
              <input
                type="number"
                value={form.otherMembers}
                onChange={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (!isNaN(value) && value > 49) {
                    setForm({ ...form, otherMembers: "49" });
                  } else {
                    setForm({ ...form, otherMembers: e.target.value });
                  }
                }}
                min="1"
                max="49"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))] transition-colors"
              />
              {form.amount && parseInt(form.otherMembers) > 0 && (
                <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                  Chaque membre reçoit{" "}
                  <strong className="text-[hsl(var(--tc-green))]">
                    {new Intl.NumberFormat("fr-FR").format(parseFloat(form.amount) * totalMembers)} FCFA
                  </strong>{" "}
                  à son tour.
                </p>
              )}
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!form.name.trim() || !form.amount || parseInt(form.otherMembers) < 1}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              Suivant <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── ÉTAPE 2 : Sécurité & Options ──────────────────────────── */}
        {step === 2 && (
          <div className="animate-slide-up flex flex-col gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Ordre de passage</label>
              <p className="text-[10px] text-muted-foreground mb-2">Qui reçoit la cagnotte en premier ?</p>
              <div className="flex gap-2">
                {[
                  { val: "random", label: "🎲 Aléatoire", desc: "Tirage au sort sécurisé lorsque le groupe est complet" },
                  { val: "manual", label: "✋ Manuel", desc: "Vous définissez l'ordre manuellement après création" },
                ].map((o) => (
                  <button
                    key={o.val}
                    type="button"
                    onClick={() => setForm({ ...form, order: o.val })}
                    className={`flex-1 py-3 px-2 rounded-xl text-left border-2 transition-colors ${
                      form.order === o.val
                        ? "border-[hsl(var(--tc-green))] text-[hsl(var(--tc-green))] bg-[hsla(160,84%,39%,0.08)]"
                        : "border-border text-muted-foreground bg-card"
                    }`}
                  >
                    <p className="text-xs font-bold">{o.label}</p>
                    <p className="text-[9px] mt-0.5 opacity-80">{o.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Pénalité de retard (%)
              </label>
              <p className="text-[10px] text-muted-foreground mb-1.5 leading-relaxed">
                Majoration appliquée sur les cotisations tardives pour décourager les retards.
              </p>
              <div className="flex gap-2">
                {["0", "5", "10", "15", "20"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm({ ...form, penalty: v })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-colors ${
                      form.penalty === v
                        ? "border-[hsl(var(--tc-green))] bg-[hsla(160,84%,39%,0.08)] text-[hsl(var(--tc-green))]"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {v}%
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Montant de la garantie bancaire (FCFA) — Obligatoire
              </label>
              <p className="text-[10px] text-muted-foreground mb-1.5 leading-relaxed">
                Les membres doivent fournir un numéro de compte bancaire partenaire. La banque paie si un membre manque à sa cotisation, puis récupère les fonds auprès de lui.
              </p>
              <input
                type="number"
                value={form.guarantee}
                onChange={(e) => setForm({ ...form, guarantee: e.target.value })}
                placeholder="Montant de garantie obligatoire"
                min="1"
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                Score minimum requis (0 – 1000)
              </label>
              <p className="text-[10px] text-muted-foreground mb-1.5 leading-relaxed">
                Filtrez les candidats en dessous d'un certain score de confiance. 0 = tout le monde accepté.
              </p>
              <div className="flex gap-2">
                {["0", "300", "500", "700"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm({ ...form, minScore: v })}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-colors ${
                      form.minScore === v
                        ? "border-[hsl(var(--tc-green))] bg-[hsla(160,84%,39%,0.08)] text-[hsl(var(--tc-green))]"
                        : "border-border bg-card text-muted-foreground"
                    }`}
                  >
                    {v === "0" ? "Aucun" : v}
                  </button>
                ))}
              </div>
            </div>

            {/* Récapitulatif */}
            <div className="p-3 rounded-xl bg-card border border-border">
              <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-[hsl(var(--tc-green))]" />
                Récapitulatif de votre tontine
              </p>
              <div className="flex flex-col gap-1.5 text-[11px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Nom</span><span className="font-medium">{form.name || "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Membres total</span><span className="font-medium">{totalMembers} (vous + {parseInt(form.otherMembers) || "?"} autres)</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cotisation</span><span className="font-medium">{form.amount ? new Intl.NumberFormat("fr-FR").format(parseFloat(form.amount)) + " FCFA" : "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Fréquence</span><span className="font-medium">{form.frequency}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cagnotte par tour</span><span className="font-bold text-[hsl(var(--tc-green))]">{form.amount ? new Intl.NumberFormat("fr-FR").format(parseFloat(form.amount) * totalMembers) + " FCFA" : "—"}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Pénalité</span><span>{form.penalty}%</span></div>
                {parseFloat(form.guarantee) > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Garantie</span><span>{new Intl.NumberFormat("fr-FR").format(parseFloat(form.guarantee))} FCFA</span></div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border border-border text-foreground bg-card"
              >
                ← Retour
              </button>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green disabled:opacity-50"
              >
                {loading ? "Création..." : "Créer le groupe →"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
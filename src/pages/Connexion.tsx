import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { toast } from "sonner";
import { Users, X } from "lucide-react";
import { getDemoAccounts, removeDemoAccount, saveDemoAccount, type DemoAccountRecord } from "@/lib/demoMultiAccount";

export default function Connexion() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [memoDemo, setMemoDemo] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<DemoAccountRecord[]>([]);

  const refreshSaved = useCallback(() => {
    setSavedAccounts(getDemoAccounts());
  }, []);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    refreshSaved();
  }, [refreshSaved]);

  const finishLogin = (loggedEmail: string, loggedPassword: string) => {
    if (rememberMe) {
      localStorage.setItem("rememberedEmail", loggedEmail);
    } else {
      localStorage.removeItem("rememberedEmail");
    }
    if (memoDemo) {
      saveDemoAccount(loggedEmail, loggedPassword);
      refreshSaved();
    }
    toast.success("Connexion réussie !");
    navigate("/home");
  };

  const handleLogin = async () => {
    if (!isSupabaseConfigured) {
      toast.error("Configuration Supabase manquante. Vérifiez le fichier .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY).");
      return;
    }
    if (password.length < 6 || !email) {
      toast.error("Veuillez entrer une adresse email valide et un mot de passe (min. 6 caractères)");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      finishLogin(email, password);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Identifiants incorrects";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (acc: DemoAccountRecord) => {
    if (!isSupabaseConfigured) {
      toast.error("Configuration Supabase manquante. Ajoutez les clés dans .env à la racine du projet.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: acc.email,
        password: acc.password,
      });
      if (error) throw error;
      setEmail(acc.email);
      if (rememberMe) localStorage.setItem("rememberedEmail", acc.email);
      toast.success(`Connecté · ${acc.label}`);
      navigate("/home");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Connexion impossible";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSaved = (e: React.MouseEvent, accEmail: string) => {
    e.stopPropagation();
    removeDemoAccount(accEmail);
    refreshSaved();
    toast("Compte retiré de cet appareil", { duration: 2500 });
  };

  return (
    <div className="flex flex-col min-h-screen animate-slide-up">
      <TopBar title="Connexion" backTo="/" backLabel="Retour" />
      <div className="flex-1 px-4 pt-4 pb-8">
        {!isSupabaseConfigured && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-[hsla(0,84%,60%,0.35)] bg-[hsla(0,84%,60%,0.08)] px-3 py-2.5 text-[11px] text-foreground leading-relaxed"
          >
            <strong className="font-semibold">Configuration requise.</strong> Créez un fichier{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[10px]">.env</code> à la racine avec{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[10px]">VITE_SUPABASE_URL</code> et{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-[10px]">VITE_SUPABASE_ANON_KEY</code>, puis
            redémarrez <code className="rounded bg-muted px-1 py-0.5 text-[10px]">npm run dev</code>.
          </div>
        )}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl tc-gradient-green flex items-center justify-center mx-auto mb-4 tc-shadow-green">
            <span className="text-white text-xl">🔐</span>
          </div>
          <h2 className="text-lg font-bold">Bon retour !</h2>
          <p className="text-xs text-muted-foreground mt-1">Connectez-vous avec votre adresse email</p>
        </div>

        {savedAccounts.length > 0 && (
          <div className="mb-6 rounded-2xl border border-[hsla(160,35%,42%,0.2)] bg-[hsla(160,22%,96%,0.5)] dark:bg-[hsla(160,12%,14%,0.4)] p-3">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[hsl(var(--tc-green))]" />
              <p className="text-xs font-semibold text-foreground/90">Comptes sur cet appareil (démo)</p>
            </div>
            <p className="text-[10px] text-muted-foreground mb-2 leading-relaxed">
              Connexion en un toucher pour la présentation. Les mots de passe sont stockés localement, en clair — ne pas utiliser avec de vraies données sensibles.
            </p>
            <ul className="flex flex-col gap-2">
              {savedAccounts.map((acc) => (
                <li
                  key={acc.email}
                  className="flex items-center gap-2 rounded-xl bg-card border border-border/80 px-2 py-2"
                >
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickLogin(acc)}
                    className="flex-1 text-left min-w-0 disabled:opacity-50"
                  >
                    <p className="text-xs font-semibold truncate">{acc.label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{acc.email}</p>
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={(e) => handleRemoveSaved(e, acc.email)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-[hsl(var(--tc-red))] hover:bg-[hsla(0,84%,60%,0.08)]"
                    aria-label={`Retirer ${acc.email}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Adresse Email</label>
        <div className="flex gap-2 mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ama.kossou@email.com"
            className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))] transition-colors"
            autoComplete="username"
          />
        </div>

        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Mot de passe</label>
        <div className="flex gap-2 mb-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
            className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))] transition-colors"
            autoComplete="current-password"
          />
        </div>

        <div className="space-y-3 mb-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-border text-[hsl(var(--tc-green))] focus:ring-[hsl(var(--tc-green))]"
            />
            <span className="text-xs text-muted-foreground font-medium">Se souvenir de mon email</span>
          </label>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={memoDemo}
              onChange={(e) => setMemoDemo(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-border text-[hsl(var(--tc-green))] focus:ring-[hsl(var(--tc-green))]"
            />
            <span className="text-xs text-muted-foreground leading-snug">
              <span className="font-medium text-foreground/90">Mémoriser ce compte sur l’appareil (démo)</span>
              <br />
              Enregistre l’email et le mot de passe pour une reconnexion rapide. Réservé aux démonstrations.
            </span>
          </label>
        </div>

        <button
          type="button"
          onClick={handleLogin}
          disabled={loading || password.length < 6}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green mb-3 disabled:opacity-50"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>

        <p className="text-center mt-6">
          <button type="button" onClick={() => navigate("/inscription")} className="text-xs text-[hsl(var(--tc-green))] font-medium">
            Pas de compte ? Créer →
          </button>
        </p>
      </div>
    </div>
  );
}

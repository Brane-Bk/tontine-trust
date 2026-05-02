import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function Connexion() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (password.length < 6 || !email) {
      toast.error("Veuillez entrer une adresse email valide et un mot de passe (min. 6 caractères)");
      return;
    }

    setLoading(true);
    try {

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast.success("Connexion réussie !");
      navigate("/home");
    } catch (error: any) {
      toast.error(error.message || "Identifiants incorrects");
    } finally {
      setLoading(false);
    }
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
          <p className="text-xs text-muted-foreground mt-1">Connectez-vous avec votre adresse email</p>
        </div>

        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Adresse Email</label>
        <div className="flex gap-2 mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ama.kossou@email.com"
            className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))] transition-colors"
          />
        </div>

        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Mot de passe</label>
        <div className="flex gap-2 mb-6">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
            className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))] transition-colors"
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || password.length < 6}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green mb-3 disabled:opacity-50"
        >
          {loading ? "Connexion..." : "Se connecter"}
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
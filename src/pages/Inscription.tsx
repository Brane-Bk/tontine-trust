import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/layout/TopBar";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import PhoneInput from "@/components/ui/PhoneInput";
import { saveDemoAccount } from "@/lib/demoMultiAccount";

export default function Inscription() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [memoDemo, setMemoDemo] = useState(true);

  const handleSignUp = async () => {
    if (!email || !name || !phone || password.length < 6) {
      toast.error("Veuillez remplir tous les champs et entrer un mot de passe d'au moins 6 caractères");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name, phone }
        }
      });
      
      if (error) throw error;

      // Supabase returns success but empty identities if the user already exists (to prevent email enumeration)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        toast.error("Un compte existe déjà avec cette adresse email. Allez à la connexion.");
        setLoading(false);
        return;
      }

      // Confirmation email désactivée dans Supabase → session immédiate
      if (data.session) {
        if (memoDemo) {
          saveDemoAccount(email, password, name);
        }
        toast.success("Compte créé ! Bienvenue.");
        navigate("/home", { replace: true });
        return;
      }

      setIsSuccess(true);
      toast.success("Vérifiez vos emails pour confirmer votre compte !");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création du compte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen animate-slide-up">
      <TopBar
        title="Créer un compte"
        backTo="/"
        backLabel="Retour"
        rightElement={<span className="text-xs text-[hsl(var(--tc-green))] font-semibold">Profil</span>}
      />
      <div className="px-4 pt-2">
        {!isSuccess ? (
          <div className="animate-slide-up">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5">Nom complet</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ama Kossou"
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-sm outline-none focus:border-[hsl(var(--tc-green))] transition-colors mb-4"
            />
            
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

            <PhoneInput 
              label="Numéro de téléphone"
              value={phone}
              onChange={setPhone}
              className="mb-4"
            />

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

            <label className="flex items-start gap-2 cursor-pointer mt-2">
              <input
                type="checkbox"
                checked={memoDemo}
                onChange={(e) => setMemoDemo(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-border text-[hsl(var(--tc-green))]"
              />
              <span className="text-[11px] text-muted-foreground leading-snug">
                <span className="font-medium text-foreground/85">Enregistrer sur cet appareil (démo)</span> — pour changer de compte rapidement après déconnexion. Stockage local non sécurisé.
              </span>
            </label>

            <button 
              onClick={handleSignUp} 
              disabled={loading || password.length < 6 || !email || !name}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white tc-gradient-green tc-shadow-green disabled:opacity-50 mt-4"
            >
              {loading ? "Création en cours..." : "S'inscrire →"}
            </button>
          </div>
        ) : (
          <div className="animate-slide-up text-center mt-12">
            <div className="w-20 h-20 rounded-full bg-[hsl(var(--tc-green))] flex items-center justify-center mx-auto mb-6 tc-shadow-green animate-check-bounce">
              <span className="text-white text-4xl">📧</span>
            </div>
            <h2 className="text-xl font-bold mb-2">Vérifiez vos emails</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Un lien magique a été envoyé à <span className="font-semibold">{email}</span>. <br />
              Cliquez sur le lien pour vérifier votre compte et vous connecter automatiquement.
            </p>
            <button 
              onClick={() => navigate("/connexion")} 
              className="text-sm font-medium text-[hsl(var(--tc-green))]"
            >
              Aller à la connexion →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
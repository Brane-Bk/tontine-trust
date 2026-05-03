import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface Profile {
  id: string;
  name: string;
  email: string;
  initials: string;
  phone: string | null;
  wallet_balance: number;
  total_locked: number;
  score: number;
  max_score: number;
  groups_count: number;
  cycles_completed: number;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, profile: null, session: null, loading: true,
  signOut: async () => {}, refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, email?: string, name?: string, phone?: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("fetchProfile:", error.message);
      }

      if (data) {
        setProfile(data as Profile);
        return;
      }

      if (userId) {
        console.log("Profile missing for user", userId, ". Attempting repair...");
        // Si le profil manque, on tente de le créer (réparation automatique)
        const v_name = name || email?.split('@')[0] || "Utilisateur";
        const v_initials = v_name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
        
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            email: email || "",
            name: v_name,
            initials: v_initials,
            phone: phone || null,
            wallet_balance: 0,
            score: 500
          })
          .select()
          .single();
          
        if (newProfile) {
          console.log("Profile repaired successfully!");
          setProfile(newProfile as Profile);
        } else if (insertError) {
          console.error("Critical error during profile repair:", insertError);
        }
      }
    } catch (err) {
      console.error("Unexpected error in fetchProfile:", err);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(
          session.user.id, 
          session.user.email, 
          session.user.user_metadata?.name,
          session.user.user_metadata?.phone
        );
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(
          session.user.id, 
          session.user.email, 
          session.user.user_metadata?.name,
          session.user.user_metadata?.phone
        );
      }
      else setProfile(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, session, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

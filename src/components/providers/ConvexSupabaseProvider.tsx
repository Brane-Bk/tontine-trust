import { ConvexProviderWithAuth } from "convex/react";
import { convex } from "@/lib/convex";
import { useAuth } from "@/hooks/useAuth";

function useSupabaseConvexAuth() {
  const { session, loading } = useAuth();

  return {
    isLoading: loading,
    isAuthenticated: Boolean(session?.access_token),
    fetchAccessToken: async () => session?.access_token ?? null,
  };
}

export function ConvexSupabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithAuth client={convex} useAuth={useSupabaseConvexAuth}>
      {children}
    </ConvexProviderWithAuth>
  );
}

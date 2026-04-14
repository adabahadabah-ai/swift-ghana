import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

type AppRole = "admin" | "moderator" | "agent" | "user";

interface AuthState {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  loading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, meta?: { full_name?: string; phone?: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<AppRole[]>;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchUserRoles(userId: string): Promise<AppRole[]> {
  // Use a SECURITY DEFINER RPC so RLS policies on user_roles can never block this.
  // Falls back to direct query if RPC is unavailable.
  const { data: rpcData, error: rpcErr } = await supabase.rpc("get_my_roles" as any);
  if (!rpcErr && rpcData) {
    return (rpcData as { role: AppRole }[]).map((r) => r.role) as AppRole[];
  }
  // Fallback: direct query (works when RLS allows it)
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  return (data?.map((r: { role: AppRole }) => r.role) ?? []) as AppRole[];
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    roles: [],
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    let mounted = true;

    // Handles initial session robustly — works even after React 18 StrictMode
    // remounts where INITIAL_SESSION from onAuthStateChange may not re-fire.
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      try {
        if (session?.user) {
          const roles = await fetchUserRoles(session.user.id);
          if (mounted) setState({ user: session.user, session, roles, loading: false, isAuthenticated: true });
        } else {
          if (mounted) setState((p) => ({ ...p, loading: false }));
        }
      } catch {
        if (mounted) setState((p) => ({ ...p, loading: false }));
      }
    });

    // Handles subsequent auth events (sign-in, sign-out, token refresh).
    // Skip INITIAL_SESSION since getSession() handles the initial load above.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'INITIAL_SESSION') return;
      if (!mounted) return;
      try {
        if (session?.user) {
          const roles = await fetchUserRoles(session.user.id);
          if (mounted) setState({ user: session.user, session, roles, loading: false, isAuthenticated: true });
        } else {
          if (mounted) setState({ user: null, session: null, roles: [], loading: false, isAuthenticated: false });
        }
      } catch {
        if (mounted) setState((p) => ({ ...p, loading: false }));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string, meta?: { full_name?: string; phone?: string }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: meta,
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<AppRole[]> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data.session || !data.user) throw new Error("No session returned");
    // Fetch roles directly and update state — onAuthStateChange(SIGNED_IN) will
    // also fire but that's fine; both paths set the same data.
    const roles = await fetchUserRoles(data.user.id);
    setState({
      user: data.user,
      session: data.session,
      roles,
      loading: false,
      isAuthenticated: true,
    });
    return roles;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // Clear local state immediately so UI reflects signed-out status right away
    setState({
      user: null,
      session: null,
      roles: [],
      loading: false,
      isAuthenticated: false,
    });
  }, []);

  const refreshRoles = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const roles = await fetchUserRoles(session.user.id);
    setState((prev) => ({
      ...prev,
      user: session.user,
      session,
      roles,
      isAuthenticated: true,
      loading: false,
    }));
  }, []);

  const hasRole = useCallback((role: AppRole) => state.roles.includes(role), [state.roles]);

  return (
    <AuthContext.Provider value={{ ...state, signUp, signIn, signOut, refreshRoles, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

import { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
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

// Fetch user roles, preferring the server-side API (which uses the service-role
// key and bypasses RLS entirely). Falls back to the SECURITY DEFINER RPC and
// then to a direct table query for local-dev / offline scenarios.
async function fetchUserRoles(userId: string, accessToken?: string): Promise<AppRole[]> {
  // Primary: server API — service role bypasses all RLS recursion issues
  if (accessToken) {
    try {
      const res = await fetch("/api/auth/get-roles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: "{}",
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.roles)) return json.roles as AppRole[];
      }
    } catch {
      // network error — fall through
    }
  }

  // Fallback 1: SECURITY DEFINER RPC (bypasses RLS if deployed)
  const { data: rpcData, error: rpcErr } = await supabase.rpc("get_my_roles" as any);
  if (!rpcErr && Array.isArray(rpcData)) {
    return (rpcData as { role: AppRole }[]).map((r) => r.role);
  }

  // Fallback 2: direct query (may be blocked by RLS depending on DB state)
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

  // When signIn() explicitly fetches roles and updates state, we skip the
  // concurrent onAuthStateChange(SIGNED_IN) event to prevent a race condition
  // where the event handler would re-fetch and overwrite the correct state.
  const skipNextSignedInRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_IN" && skipNextSignedInRef.current) {
        skipNextSignedInRef.current = false;
        return;
      }

      if (session?.user) {
        try {
          const roles = await fetchUserRoles(session.user.id, session.access_token);
          if (mounted) {
            setState({ user: session.user, session, roles, loading: false, isAuthenticated: true });
          }
        } catch {
          if (mounted) setState((p) => ({ ...p, loading: false }));
        }
      } else {
        if (mounted) {
          setState({ user: null, session: null, roles: [], loading: false, isAuthenticated: false });
        }
      }
    });

    // Safety net: never leave the app stuck in loading state forever
    const safetyTimer = setTimeout(() => {
      if (mounted) setState((p) => (p.loading ? { ...p, loading: false } : p));
    }, 5000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
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
    const roles = await fetchUserRoles(data.user.id, data.session.access_token);
    // Tell the event listener to skip the SIGNED_IN event triggered by this login
    skipNextSignedInRef.current = true;
    setState({ user: data.user, session: data.session, roles, loading: false, isAuthenticated: true });
    return roles;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, session: null, roles: [], loading: false, isAuthenticated: false });
  }, []);

  const refreshRoles = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const roles = await fetchUserRoles(session.user.id, session.access_token);
    setState((prev) => ({ ...prev, user: session.user, session, roles, isAuthenticated: true, loading: false }));
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

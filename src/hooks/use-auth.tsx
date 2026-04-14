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

// Fetch user roles in priority order:
//  1. app_metadata in JWT (set via SQL migration — zero DB queries, 100% reliable)
//  2. Server /api/auth/get-roles (service-role key, bypasses RLS)
//  3. SECURITY DEFINER RPC (if deployed)
//  4. Direct table query (last resort)
async function fetchUserRoles(
  userId: string,
  accessToken?: string,
  appMeta?: Record<string, unknown>
): Promise<AppRole[]> {
  // Primary: read roles embedded in the JWT's app_metadata.
  // Set via: UPDATE auth.users SET raw_app_meta_data = '{"roles":["admin"]}' WHERE email = ...
  if (appMeta?.roles && Array.isArray(appMeta.roles) && (appMeta.roles as unknown[]).length > 0) {
    return appMeta.roles as AppRole[];
  }

  // Secondary: server API with service-role key (bypasses all RLS)
  if (accessToken) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch("/api/auth/get-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: "{}",
        signal: ctrl.signal,
      });
      clearTimeout(t);
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json.roles)) return json.roles as AppRole[];
      }
    } catch {
      // network / timeout — fall through
    }
  }

  // Fallback 1: SECURITY DEFINER RPC (bypasses RLS if the migration was run)
  const { data: rpcData, error: rpcErr } = await supabase.rpc("get_my_roles" as any);
  if (!rpcErr && Array.isArray(rpcData)) {
    return (rpcData as { role: AppRole }[]).map((r) => r.role);
  }

  // Fallback 2: direct query
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
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
          const roles = await fetchUserRoles(session.user.id, session.access_token, session.user.app_metadata as Record<string, unknown>);
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
    // Set the skip flag BEFORE signInWithPassword so that onAuthStateChange(SIGNED_IN)
    // — which fires during or right after the await — is always suppressed. This prevents
    // the concurrent event handler from fetching roles independently and overwriting state.
    skipNextSignedInRef.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session || !data.user) throw new Error("No session returned");
      const roles = await fetchUserRoles(data.user.id, data.session.access_token, data.user.app_metadata as Record<string, unknown>);
      setState({ user: data.user, session: data.session, roles, loading: false, isAuthenticated: true });
      return roles;
    } catch (err) {
      skipNextSignedInRef.current = false; // allow future SIGNED_IN events to be handled
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setState({ user: null, session: null, roles: [], loading: false, isAuthenticated: false });
  }, []);

  const refreshRoles = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const roles = await fetchUserRoles(session.user.id, session.access_token, session.user.app_metadata as Record<string, unknown>);
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

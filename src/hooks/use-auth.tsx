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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          setState((prev) => ({
            ...prev,
            user: session.user,
            session,
            isAuthenticated: true,
            loading: true,
          }));
          const roles = await fetchUserRoles(session.user.id);
          setState({
            user: session.user,
            session,
            roles,
            loading: false,
            isAuthenticated: true,
          });
        } else {
          setState({
            user: null,
            session: null,
            roles: [],
            loading: false,
            isAuthenticated: false,
          });
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setState((prev) => ({
          ...prev,
          user: session.user,
          session,
          isAuthenticated: true,
          loading: true,
        }));
        const roles = await fetchUserRoles(session.user.id);
        setState({
          user: session.user,
          session,
          roles,
          loading: false,
          isAuthenticated: true,
        });
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    });

    return () => subscription.unsubscribe();
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
    setState((prev) => ({
      ...prev,
      user: data.user,
      session: data.session,
      isAuthenticated: true,
      loading: true,
    }));
    try {
      const roles = await fetchUserRoles(data.user.id);
      setState({
        user: data.user,
        session: data.session,
        roles,
        loading: false,
        isAuthenticated: true,
      });
      return roles;
    } catch (e) {
      setState((prev) => ({ ...prev, loading: false }));
      throw e;
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
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

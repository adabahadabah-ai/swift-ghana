import { useCallback, useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import type { DirectoryUserRow } from "@/types/directory-user";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function AdminUsersPage() {
  const { user, refreshRoles } = useAuth();
  const [users, setUsers] = useState<DirectoryUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiPost<{ users: DirectoryUserRow[] }>("/api/admin/list-users", {});
      setUsers(res.users);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load users";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    const channel = supabase
      .channel("admin-users-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => loadUsers())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => loadUsers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadUsers]);

  const toggleAdmin = async (row: DirectoryUserRow) => {
    const isAdmin = row.roles.includes("admin");
    setBusyId(row.id);
    try {
      await apiPost("/api/admin/set-user-admin-role", { user_id: row.id, is_admin: !isAdmin });
      toast.success(isAdmin ? "Admin access removed" : "User is now an admin");
      await loadUsers();
      if (user?.id === row.id) await refreshRoles();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not update admin role";
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <h2 className="text-2xl font-heading font-bold text-foreground">Users</h2>
      <p className="text-sm text-muted-foreground max-w-2xl">
        Promote accounts to admin so they can open the admin panel. The first admin must be created in Supabase (SQL or
        Table Editor) on <code className="text-foreground">user_roles</code> before this page can be used.
      </p>
      <GlassCard variant="strong">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-glass-border">
                <th className="text-left py-3 px-2">Name</th>
                <th className="text-left py-3 px-2 hidden sm:table-cell">Email</th>
                <th className="text-left py-3 px-2">Phone</th>
                <th className="text-left py-3 px-2">Roles</th>
                <th className="text-left py-3 px-2 w-[140px]">Admin</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">
                    No profiles found.
                  </td>
                </tr>
              ) : null}
              {users.map((u) => {
                const isAdmin = u.roles.includes("admin");
                return (
                  <tr key={u.id} className="border-b border-glass-border/50 hover:bg-accent/10">
                    <td className="py-3 px-2 font-medium text-foreground">{u.full_name || "—"}</td>
                    <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{u.email || "—"}</td>
                    <td className="py-3 px-2 text-muted-foreground">{u.phone || "—"}</td>
                    <td className="py-3 px-2">
                      <div className="flex flex-wrap gap-1">
                        {u.roles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          u.roles.map((r) => (
                            <span
                              key={r}
                              className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary"
                            >
                              {r}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={busyId === u.id}
                        onClick={() => toggleAdmin(u)}
                      >
                        {busyId === u.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : isAdmin ? (
                          "Remove admin"
                        ) : (
                          "Make admin"
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

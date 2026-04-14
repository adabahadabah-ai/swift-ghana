import { useCallback, useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";
import { supabase } from "@/integrations/supabase/client";
import type { DirectoryUserRow } from "@/types/directory-user";
import { Loader2, UserCheck, UserX } from "lucide-react";

export default function AdminAgentsPage() {
  const [users, setUsers] = useState<DirectoryUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiPost<{ users: DirectoryUserRow[] }>("/api/admin/list-users", {});
      setUsers(res.users);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
    const channel = supabase
      .channel("admin-agents-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => loadUsers())
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => loadUsers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadUsers]);

  const toggleAgent = async (row: DirectoryUserRow) => {
    const isAgent = row.roles.includes("agent");
    setBusyId(row.id);
    try {
      const res = await apiPost<{ action: string }>("/api/admin/approve-agent", {
        user_id: row.id,
        approve: !isAgent,
      });
      toast.success(res.action === "approved" ? `${row.full_name || row.email} approved as agent` : `Agent access revoked for ${row.full_name || row.email}`);
      await loadUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not update agent role");
    } finally {
      setBusyId(null);
    }
  };

  // Show all users; agents at top
  const sorted = [...users].sort((a, b) => {
    const aAgent = a.roles.includes("agent") ? 0 : 1;
    const bAgent = b.roles.includes("agent") ? 0 : 1;
    return aAgent - bAgent;
  });

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-foreground">Agents</h2>
        <p className="text-xs text-muted-foreground">Approve or revoke agent access. Approved users bypass the GH₵80 fee.</p>
      </div>
      <GlassCard variant="strong">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs border-b border-glass-border">
                  <th className="text-left py-3 px-2">Name</th>
                  <th className="text-left py-3 px-2 hidden sm:table-cell">Email</th>
                  <th className="text-left py-3 px-2">Phone</th>
                  <th className="text-left py-3 px-2">Roles</th>
                  <th className="text-left py-3 px-2 w-[160px]">Agent Access</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground text-sm">No users found.</td></tr>
                )}
                {sorted.map((u) => {
                  const isAgent = u.roles.includes("agent");
                  const isAdmin = u.roles.includes("admin");
                  return (
                    <tr key={u.id} className="border-b border-glass-border/50 hover:bg-accent/10">
                      <td className="py-3 px-2 font-medium text-foreground">{u.full_name || "—"}</td>
                      <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{u.email || "—"}</td>
                      <td className="py-3 px-2 text-muted-foreground">{u.phone || "—"}</td>
                      <td className="py-3 px-2">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.length === 0 ? (
                            <span className="text-xs text-muted-foreground">user</span>
                          ) : u.roles.map((r) => (
                            <span key={r} className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary">{r}</span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        {isAdmin ? (
                          <StatusBadge status="active" />
                        ) : (
                          <Button
                            variant={isAgent ? "ghost" : "outline"}
                            size="sm"
                            disabled={busyId === u.id}
                            onClick={() => toggleAgent(u)}
                            className="gap-1.5"
                          >
                            {busyId === u.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : isAgent ? (
                              <><UserX className="h-3.5 w-3.5" /> Revoke</>
                            ) : (
                              <><UserCheck className="h-3.5 w-3.5" /> Approve</>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

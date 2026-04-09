import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { Copy, UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function SubAgentsPage() {
  const { user } = useAuth();
  const [subAgents, setSubAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const referralLink = typeof window !== "undefined"
    ? `${window.location.origin}/agent-signup?ref=${user?.id?.slice(0, 8) || "agent"}`
    : "";

  useEffect(() => {
    if (!user) return;
    const fetchSubAgents = async () => {
      const { data } = await supabase
        .from("sub_agents")
        .select("*")
        .eq("parent_agent_id", user.id);

      if (data && data.length > 0) {
        // Fetch profiles for sub-agents
        const userIds = data.map((sa: any) => sa.sub_agent_user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, phone, email")
          .in("id", userIds);

        const merged = data.map((sa: any) => {
          const profile = profiles?.find((p: any) => p.id === sa.sub_agent_user_id);
          return { ...sa, profile };
        });
        setSubAgents(merged);
      }
      setLoading(false);
    };
    fetchSubAgents();
  }, [user]);

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Sub-Agents</h2>
          <p className="text-sm text-muted-foreground">Manage your recruited agents</p>
        </div>
        <Button variant="gold" onClick={copyLink}>
          <UserPlus className="h-4 w-4" /> Invite Agent
        </Button>
      </div>

      <GlassCard className="flex items-center gap-3 p-4">
        <div className="flex-1 text-sm text-muted-foreground font-mono bg-glass rounded-lg px-3 py-2 border border-glass-border truncate">
          {referralLink}
        </div>
        <Button variant="outline" size="sm" onClick={copyLink}>
          <Copy className="h-4 w-4" />
        </Button>
      </GlassCard>

      <GlassCard variant="strong">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-glass-border">
                <th className="text-left py-3 px-2">Name</th>
                <th className="text-left py-3 px-2 hidden sm:table-cell">Phone</th>
                <th className="text-left py-3 px-2 hidden sm:table-cell">Email</th>
                <th className="text-left py-3 px-2">Joined</th>
                <th className="text-left py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {subAgents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground">
                    No sub-agents yet. Share your referral link to start recruiting!
                  </td>
                </tr>
              ) : (
                subAgents.map((sa) => (
                  <tr key={sa.id} className="border-b border-glass-border/50 hover:bg-accent/10">
                    <td className="py-3 px-2 font-medium text-foreground">{sa.profile?.full_name || "Unknown"}</td>
                    <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{sa.profile?.phone || "-"}</td>
                    <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{sa.profile?.email || "-"}</td>
                    <td className="py-3 px-2 text-muted-foreground">{new Date(sa.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-2"><StatusBadge status={sa.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

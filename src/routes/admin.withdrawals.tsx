import { useState, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const fetchWithdrawals = async () => {
    // Admin can view all withdrawals via RLS
    const { data } = await supabase
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false });

    if (data && data.length > 0) {
      // Fetch agent profiles
      const agentIds = [...new Set(data.map((w: any) => w.agent_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, phone")
        .in("id", agentIds);

      // Fetch wallet totals
      const { data: wallets } = await supabase
        .from("wallets")
        .select("agent_id, total_profit, balance")
        .in("agent_id", agentIds);

      const merged = data.map((w: any) => ({
        ...w,
        profile: profiles?.find((p: any) => p.id === w.agent_id),
        wallet: wallets?.find((wl: any) => wl.agent_id === w.agent_id),
      }));
      setWithdrawals(merged);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWithdrawals();
    const channel = supabase
      .channel("admin-withdrawals-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "withdrawals" }, () => fetchWithdrawals())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleConfirm = async (id: string) => {
    setConfirming(id);
    try {
      await apiPost("/api/admin/confirm-withdrawal", { withdrawal_id: id });
      toast.success("Withdrawal confirmed and profit deducted!");
      fetchWithdrawals();
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm withdrawal");
    }
    setConfirming(null);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-up">
      <h2 className="text-2xl font-heading font-bold text-foreground">Withdrawal Requests</h2>

      <GlassCard variant="strong">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-glass-border">
                <th className="text-left py-3 px-2">Agent</th>
                <th className="text-left py-3 px-2">Amount</th>
                <th className="text-left py-3 px-2 hidden sm:table-cell">Total Profit</th>
                <th className="text-left py-3 px-2">MoMo</th>
                <th className="text-left py-3 px-2 hidden sm:table-cell">Name</th>
                <th className="text-left py-3 px-2">Date</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-muted-foreground">No withdrawal requests</td>
                </tr>
              ) : (
                withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-glass-border/50 hover:bg-accent/10">
                    <td className="py-3 px-2">
                      <p className="font-medium text-foreground">{w.profile?.full_name || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{w.profile?.email}</p>
                    </td>
                    <td className="py-3 px-2 font-bold text-primary">GH₵{Number(w.amount).toFixed(2)}</td>
                    <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">
                      GH₵{w.wallet ? Number(w.wallet.total_profit).toFixed(2) : "0.00"}
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">{w.momo_network} - {w.momo_number}</td>
                    <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{w.momo_name}</td>
                    <td className="py-3 px-2 text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-2"><StatusBadge status={w.status} /></td>
                    <td className="py-3 px-2">
                      {w.status === "pending" && (
                        <Button
                          variant="gold"
                          size="sm"
                          onClick={() => handleConfirm(w.id)}
                          disabled={confirming === w.id}
                        >
                          {confirming === w.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><CheckCircle className="h-3 w-3" /> Confirm</>}
                        </Button>
                      )}
                    </td>
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

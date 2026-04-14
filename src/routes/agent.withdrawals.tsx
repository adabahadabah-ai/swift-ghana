import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { DollarSign, ArrowDownToLine, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";

export default function WithdrawalsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [totalProfit, setTotalProfit] = useState(0);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    momo_number: "",
    momo_network: "MTN",
    momo_name: "",
  });

  const requestWithdrawalFn = useServerFn(requestWithdrawal);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("wallets").select("total_profit").eq("agent_id", user.id).single(),
      supabase.from("withdrawals").select("*").eq("agent_id", user.id).order("created_at", { ascending: false }),
    ]).then(([walletRes, wdRes]) => {
      if (walletRes.data) setTotalProfit(Number(walletRes.data.total_profit));
      if (wdRes.data) setWithdrawals(wdRes.data);
      setLoading(false);
    });
  }, [user]);

  const totalWithdrawn = withdrawals
    .filter((w) => w.status === "completed")
    .reduce((sum: number, w: any) => sum + Number(w.amount), 0);

  const pendingAmount = withdrawals
    .filter((w) => w.status === "pending")
    .reduce((sum: number, w: any) => sum + Number(w.amount), 0);

  const availableForWithdrawal = totalProfit - pendingAmount;
  const hasPending = withdrawals.some((w) => w.status === "pending");

  const handleSubmit = async () => {
    const amount = parseFloat(form.amount);
    if (!amount || amount < 20) {
      toast.error("Minimum withdrawal is GH₵20.00");
      return;
    }
    if (amount > availableForWithdrawal) {
      toast.error("Amount exceeds available profit");
      return;
    }
    if (!form.momo_number || form.momo_number.replace(/\s/g, "").length < 10) {
      toast.error("Enter a valid MoMo number");
      return;
    }
    if (!form.momo_name.trim()) {
      toast.error("Enter the name on the MoMo account");
      return;
    }

    setSubmitting(true);
    try {
      await apiPost("/api/agent/request-withdrawal", {
        amount,
        momo_number: form.momo_number.replace(/\s/g, ""),
        momo_network: form.momo_network as "MTN" | "AirtelTigo" | "Telecel",
        momo_name: form.momo_name.trim(),
      });
      toast.success("Withdrawal request submitted! Please allow up to 24 hours.");
      setShowForm(false);
      setForm({ amount: "", momo_number: "", momo_network: "MTN", momo_name: "" });
      // Refresh
      const { data } = await supabase.from("withdrawals").select("*").eq("agent_id", user!.id).order("created_at", { ascending: false });
      if (data) setWithdrawals(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to submit withdrawal");
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-up">
      <h2 className="text-2xl font-heading font-bold text-foreground">Withdrawals</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Profit" value={`GH₵${totalProfit.toFixed(2)}`} icon={DollarSign} />
        <StatsCard title="Total Withdrawn" value={`GH₵${totalWithdrawn.toFixed(2)}`} icon={ArrowDownToLine} />
        <GlassCard hover className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Available</p>
            <p className="text-2xl font-heading font-bold text-primary">GH₵{availableForWithdrawal.toFixed(2)}</p>
          </div>
          <Button
            variant="gold"
            size="sm"
            onClick={() => setShowForm(true)}
            disabled={availableForWithdrawal < 20 || hasPending}
          >
            <ArrowDownToLine className="h-4 w-4" /> Withdraw
          </Button>
        </GlassCard>
      </div>

      {availableForWithdrawal < 20 && !hasPending && (
        <GlassCard className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            You need at least <span className="text-primary font-bold">GH₵20.00</span> in confirmed profit to request a withdrawal.
            Current: GH₵{availableForWithdrawal.toFixed(2)}
          </p>
        </GlassCard>
      )}

      {hasPending && (
        <GlassCard className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            You have a pending withdrawal. Please wait for it to be processed before requesting another.
          </p>
        </GlassCard>
      )}

      {/* Withdrawal Form */}
      {showForm && (
        <GlassCard variant="strong">
          <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Request Withdrawal</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Withdrawals are processed within 24 hours via Mobile Money.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Amount (GH₵)</label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="20.00"
                min="20"
                max={availableForWithdrawal}
                className="h-11 bg-glass border-glass-border rounded-xl"
              />
              <p className="text-xs text-muted-foreground mt-1">Min: GH₵20 | Max: GH₵{availableForWithdrawal.toFixed(2)}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">MoMo Number</label>
              <Input
                value={form.momo_number}
                onChange={(e) => setForm({ ...form, momo_number: e.target.value })}
                placeholder="024 XXX XXXX"
                className="h-11 bg-glass border-glass-border rounded-xl"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">MoMo Network</label>
              <div className="flex gap-2">
                {["MTN", "AirtelTigo", "Telecel"].map((n) => (
                  <Button
                    key={n}
                    variant={form.momo_network === n ? "gold" : "outline"}
                    size="sm"
                    onClick={() => setForm({ ...form, momo_network: n })}
                    type="button"
                  >
                    {n}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Name on MoMo Account</label>
              <Input
                value={form.momo_name}
                onChange={(e) => setForm({ ...form, momo_name: e.target.value })}
                placeholder="Kwame Asante"
                className="h-11 bg-glass border-glass-border rounded-xl"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="gold" onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Submit Request</>}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </GlassCard>
      )}

      {/* Withdrawal History */}
      <GlassCard variant="strong">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Withdrawal History</h3>
        {withdrawals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No withdrawal requests yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs border-b border-glass-border">
                  <th className="text-left py-3 px-2">Amount</th>
                  <th className="text-left py-3 px-2">MoMo</th>
                  <th className="text-left py-3 px-2 hidden sm:table-cell">Name</th>
                  <th className="text-left py-3 px-2">Date</th>
                  <th className="text-left py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id} className="border-b border-glass-border/50">
                    <td className="py-3 px-2 font-bold text-primary">GH₵{Number(w.amount).toFixed(2)}</td>
                    <td className="py-3 px-2 text-muted-foreground">{w.momo_network} - {w.momo_number}</td>
                    <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{w.momo_name}</td>
                    <td className="py-3 px-2 text-muted-foreground">{new Date(w.created_at).toLocaleDateString()}</td>
                    <td className="py-3 px-2"><StatusBadge status={w.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

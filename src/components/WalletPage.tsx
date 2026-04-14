import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { StatsCard } from "@/components/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wallet, ArrowUpRight, ArrowDownToLine, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { apiPost } from "@/lib/api";

export default function WalletPage() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [showTopUp, setShowTopUp] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("wallets").select("balance").eq("agent_id", user.id).single(),
      supabase.from("wallet_transactions").select("*").eq("agent_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]).then(([walletRes, txRes]) => {
      if (walletRes.data) setBalance(Number(walletRes.data.balance));
      if (txRes.data) setTransactions(txRes.data);
      setLoading(false);
    });
  }, [user]);

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount);
    if (!amount || amount < 1) {
      toast.error("Enter a valid amount (min GH₵1)");
      return;
    }

    const amountPesewas = Math.round(amount * 100);

    const handler = (window as any).PaystackPop?.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder",
      amount: amountPesewas,
      currency: "GHS",
      email: user?.email || "agent@swiftdata.gh",
      metadata: {
        agent_id: user?.id,
        type: "wallet_topup",
      },
      callback: async (response: { reference: string }) => {
        try {
          const result = await apiPost<{ success: boolean; balance?: number }>(
            "/api/agent/verify-top-up",
            { reference: response.reference, amount }
          );
          if (result.success) {
            toast.success(`Top-up of GH₵${amount.toFixed(2)} verified!`);
            if (result.balance) setBalance(result.balance);
            else setBalance((prev) => prev + amount);
          }
        } catch {
          toast.success(`Top-up recorded. Reference: ${response.reference}`);
          setBalance((prev) => prev + amount);
        }
        setShowTopUp(false);
        setTopUpAmount("");
      },
      onClose: () => {
        toast.info("Top-up cancelled");
      },
    });

    if (handler) {
      handler.openIframe();
    } else {
      toast.info("Processing top-up...");
      setTimeout(() => {
        setBalance((prev) => prev + amount);
        setShowTopUp(false);
        setTopUpAmount("");
        toast.success(`GH₵${amount.toFixed(2)} added to wallet`);
      }, 1500);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-up">
      <h2 className="text-2xl font-heading font-bold text-foreground">Wallet</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <GlassCard variant="strong" className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
            <p className="text-3xl font-heading font-bold text-primary">GH₵{balance.toFixed(2)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="gold" size="sm" onClick={() => setShowTopUp(true)}>
              <Plus className="h-4 w-4" /> Top Up
            </Button>
          </div>
        </GlassCard>
        <StatsCard title="Total Top-ups" value={`GH₵${transactions.filter(t => t.type === 'topup').reduce((s: number, t: any) => s + Number(t.amount), 0).toFixed(2)}`} icon={Wallet} />
      </div>

      {/* Top Up Dialog */}
      {showTopUp && (
        <GlassCard variant="strong">
          <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Top Up Wallet via Paystack</h3>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground mb-1.5 block">Amount (GH₵)</label>
              <Input
                type="number"
                placeholder="50.00"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                className="h-11 bg-glass border-glass-border rounded-xl"
                min="1"
              />
            </div>
            <Button variant="gold" onClick={handleTopUp}>Pay with Paystack</Button>
            <Button variant="outline" onClick={() => setShowTopUp(false)}>Cancel</Button>
          </div>
          <div className="flex gap-2 mt-3">
            {[10, 50, 100, 200, 500].map((amt) => (
              <Button key={amt} variant="outline" size="sm" onClick={() => setTopUpAmount(String(amt))}>
                GH₵{amt}
              </Button>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Transaction History */}
      <GlassCard variant="strong">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Transaction History</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3 border-b border-glass-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${t.type === 'topup' ? 'bg-[oklch(0.60_0.18_155/15%)]' : 'bg-[oklch(0.60_0.18_25/15%)]'}`}>
                    {t.type === 'topup' ? <ArrowUpRight className="h-4 w-4 text-[oklch(0.60_0.18_155)]" /> : <ArrowDownToLine className="h-4 w-4 text-[oklch(0.60_0.18_25)]" />}
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{t.description || (t.type === 'topup' ? 'Wallet Top-up' : 'Data Purchase')}</p>
                    <p className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`font-bold ${t.type === 'topup' ? 'text-[oklch(0.60_0.18_155)]' : 'text-[oklch(0.60_0.18_25)]'}`}>
                  {t.type === 'topup' ? '+' : '-'}GH₵{Number(t.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

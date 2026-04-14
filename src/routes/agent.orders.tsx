import { useCallback, useEffect, useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import { apiPost } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

function orderStatusBadge(
  s: string,
): "completed" | "failed" | "processing" | "pending" | "active" | "blocked" {
  if (s === "completed" || s === "failed" || s === "processing" || s === "pending") return s;
  return "pending";
}

type AgentOrderRow = {
  id: string;
  created_at: string;
  customer_phone: string | null;
  network: string | null;
  package_size: string | null;
  amount: number;
  status: string;
  profit: number;
};

export default function AgentOrdersPage() {
  const [orders, setOrders] = useState<AgentOrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiPost<{ orders: AgentOrderRow[] }>("/api/agent/list-orders", {});
      setOrders(res.orders);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-heading font-bold text-foreground">My Orders</h2>
        <button type="button" onClick={load} className="text-xs text-primary hover:underline">
          Refresh
        </button>
      </div>
      <p className="text-sm text-muted-foreground max-w-2xl">
        Purchases made through your mini-store link only.
      </p>
      <GlassCard variant="strong">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-glass-border">
                <th className="text-left py-3 px-2">When</th>
                <th className="text-left py-3 px-2">Phone</th>
                <th className="text-left py-3 px-2 hidden sm:table-cell">Network</th>
                <th className="text-left py-3 px-2">Bundle</th>
                <th className="text-left py-3 px-2">Amount</th>
                <th className="text-left py-3 px-2 hidden md:table-cell">Your profit</th>
                <th className="text-left py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground">
                    No orders on your store yet
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="border-b border-glass-border/50 hover:bg-accent/10">
                    <td className="py-3 px-2 text-muted-foreground whitespace-nowrap text-xs">
                      {new Date(o.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 font-mono text-foreground">{o.customer_phone ?? "—"}</td>
                    <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{o.network ?? "—"}</td>
                    <td className="py-3 px-2 text-foreground">{o.package_size ?? "—"}</td>
                    <td className="py-3 px-2 text-primary font-medium">GH₵{Number(o.amount).toFixed(2)}</td>
                    <td className="py-3 px-2 text-muted-foreground hidden md:table-cell">
                      GH₵{Number(o.profit).toFixed(2)}
                    </td>
                    <td className="py-3 px-2">
                      <StatusBadge status={orderStatusBadge(o.status)} />
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

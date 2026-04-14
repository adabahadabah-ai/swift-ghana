import { GlassCard } from "@/components/GlassCard";
import { StatusBadge } from "@/components/StatusBadge";
import { recentOrders } from "@/lib/mock-data";

export default function AgentOrdersPage() {
  return (
    <div className="space-y-6 animate-fade-up">
      <h2 className="text-2xl font-heading font-bold text-foreground">My Orders</h2>
      <GlassCard variant="strong">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-glass-border">
                <th className="text-left py-3 px-2">Order</th>
                <th className="text-left py-3 px-2">Phone</th>
                <th className="text-left py-3 px-2 hidden sm:table-cell">Network</th>
                <th className="text-left py-3 px-2">Bundle</th>
                <th className="text-left py-3 px-2">Amount</th>
                <th className="text-left py-3 px-2 hidden sm:table-cell">Date</th>
                <th className="text-left py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => (
                <tr key={o.id} className="border-b border-glass-border/50 hover:bg-accent/10">
                  <td className="py-3 px-2 font-medium text-foreground">{o.id}</td>
                  <td className="py-3 px-2 text-muted-foreground">{o.phone}</td>
                  <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{o.network}</td>
                  <td className="py-3 px-2 text-foreground">{o.bundle}</td>
                  <td className="py-3 px-2 text-primary font-medium">GH₵{o.amount}</td>
                  <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{o.date}</td>
                  <td className="py-3 px-2"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

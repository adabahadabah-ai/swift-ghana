import { StatsCard } from "@/components/StatsCard";
import { GlassCard } from "@/components/GlassCard";
import { ShoppingCart, Wallet, FileText, UserPlus } from "lucide-react";
import { salesData, recentOrders } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function AgentOverview() {
  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground mb-1">Welcome back, John 👋</h2>
        <p className="text-sm text-muted-foreground">Here's your business at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Sales" value="GH₵12,450" icon={ShoppingCart} change="12% this week" positive />
        <StatsCard title="Wallet Balance" value="GH₵2,340" icon={Wallet} />
        <StatsCard title="Total Orders" value="342" icon={FileText} change="8% this week" positive />
        <StatsCard title="Sub-Agents" value="5" icon={UserPlus} />
      </div>

      {/* Chart */}
      <GlassCard variant="strong">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Sales Overview</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.87 0.17 90)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="oklch(0.87 0.17 90)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.01 260 / 30%)" />
              <XAxis dataKey="month" stroke="oklch(0.65 0.02 260)" fontSize={12} />
              <YAxis stroke="oklch(0.65 0.02 260)" fontSize={12} />
              <Tooltip
                contentStyle={{ background: "oklch(0.18 0.01 260 / 90%)", border: "1px solid oklch(0.50 0.01 260 / 20%)", borderRadius: "12px", color: "white" }}
              />
              <Area type="monotone" dataKey="sales" stroke="oklch(0.87 0.17 90)" fill="url(#goldGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Recent Orders */}
      <GlassCard variant="strong">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-glass-border">
                <th className="text-left py-3 px-2">Order</th>
                <th className="text-left py-3 px-2">Phone</th>
                <th className="text-left py-3 px-2 hidden sm:table-cell">Network</th>
                <th className="text-left py-3 px-2">Bundle</th>
                <th className="text-left py-3 px-2">Amount</th>
                <th className="text-left py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.slice(0, 5).map((o) => (
                <tr key={o.id} className="border-b border-glass-border/50 hover:bg-accent/10">
                  <td className="py-3 px-2 font-medium text-foreground">{o.id}</td>
                  <td className="py-3 px-2 text-muted-foreground">{o.phone}</td>
                  <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{o.network}</td>
                  <td className="py-3 px-2 text-foreground">{o.bundle}</td>
                  <td className="py-3 px-2 text-primary font-medium">GH₵{o.amount}</td>
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

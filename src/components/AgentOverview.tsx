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
        <h2 className="text-xl font-heading font-bold text-foreground tracking-tight">Welcome back 👋</h2>
        <p className="text-xs text-muted-foreground mt-1">Here's your business at a glance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Total Sales" value="GH₵12,450" icon={ShoppingCart} change="12% this week" positive />
        <StatsCard title="Wallet" value="GH₵2,340" icon={Wallet} />
        <StatsCard title="Orders" value="342" icon={FileText} change="8% this week" positive />
        <StatsCard title="Sub-Agents" value="5" icon={UserPlus} />
      </div>

      {/* Chart */}
      <GlassCard variant="strong">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider">Sales Overview</h3>
          <span className="chip text-[10px]">Last 6 months</span>
        </div>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.87 0.17 90)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="oklch(0.87 0.17 90)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.01 260 / 20%)" vertical={false} />
              <XAxis dataKey="month" stroke="oklch(0.50 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="oklch(0.50 0.02 260)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.12 0.015 260 / 95%)",
                  border: "1px solid oklch(0.40 0.01 260 / 30%)",
                  borderRadius: "8px",
                  color: "white",
                  fontSize: "12px",
                  backdropFilter: "blur(20px)",
                }}
              />
              <Area type="monotone" dataKey="sales" stroke="oklch(0.87 0.17 90)" fill="url(#goldGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Recent Orders */}
      <GlassCard variant="strong">
        <h3 className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider mb-4">Recent Orders</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-glass-border">
                <th className="text-left py-2.5 px-2 font-medium uppercase tracking-wider">Order</th>
                <th className="text-left py-2.5 px-2 font-medium uppercase tracking-wider">Phone</th>
                <th className="text-left py-2.5 px-2 font-medium uppercase tracking-wider hidden sm:table-cell">Network</th>
                <th className="text-left py-2.5 px-2 font-medium uppercase tracking-wider">Bundle</th>
                <th className="text-left py-2.5 px-2 font-medium uppercase tracking-wider">Amount</th>
                <th className="text-left py-2.5 px-2 font-medium uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.slice(0, 5).map((o) => (
                <tr key={o.id} className="border-b border-glass-border/30 hover:bg-accent/5 transition-colors">
                  <td className="py-2.5 px-2 font-mono text-foreground">{o.id}</td>
                  <td className="py-2.5 px-2 text-muted-foreground">{o.phone}</td>
                  <td className="py-2.5 px-2 text-muted-foreground hidden sm:table-cell">{o.network}</td>
                  <td className="py-2.5 px-2 text-foreground">{o.bundle}</td>
                  <td className="py-2.5 px-2 text-primary font-medium">GH₵{o.amount}</td>
                  <td className="py-2.5 px-2"><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

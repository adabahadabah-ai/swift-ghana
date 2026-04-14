import { StatsCard } from "@/components/StatsCard";
import { GlassCard } from "@/components/GlassCard";
import { Users, UserPlus, ShoppingCart, DollarSign } from "lucide-react";
import { salesData } from "@/lib/mock-data";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export default function AdminOverview() {
  return (
    <div className="space-y-6 animate-fade-up">
      <h2 className="text-2xl font-heading font-bold text-foreground">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value="1,245" icon={Users} change="5% this week" positive variant="yellow" />
        <StatsCard title="Total Agents" value="86" icon={UserPlus} change="3 new" positive variant="dark" />
        <StatsCard title="Total Sales" value="GH₵45,200" icon={ShoppingCart} change="12%" positive />
        <StatsCard title="Revenue" value="GH₵8,900" icon={DollarSign} change="8%" positive variant="yellow" />
      </div>

      <GlassCard variant="strong">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Revenue Overview</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="goldGradAdmin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.75 0.18 85)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="oklch(0.75 0.18 85)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0.01 260 / 40%)" />
              <XAxis dataKey="month" stroke="oklch(0.50 0.02 260)" fontSize={12} />
              <YAxis stroke="oklch(0.50 0.02 260)" fontSize={12} />
              <Tooltip contentStyle={{ background: "oklch(0.99 0 0 / 95%)", border: "1px solid oklch(0.85 0.01 260 / 50%)", borderRadius: "12px", color: "oklch(0.15 0.01 260)" }} />
              <Area type="monotone" dataKey="sales" stroke="oklch(0.75 0.18 85)" fill="url(#goldGradAdmin)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}

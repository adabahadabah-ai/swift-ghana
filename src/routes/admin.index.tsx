import { createFileRoute } from "@tanstack/react-router";
import { StatsCard } from "@/components/StatsCard";
import { GlassCard } from "@/components/GlassCard";
import { Users, UserPlus, ShoppingCart, DollarSign } from "lucide-react";
import { salesData } from "@/lib/mock-data";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

export const Route = createFileRoute("/admin/")({
  component: AdminOverview,
});

function AdminOverview() {
  return (
    <div className="space-y-6 animate-fade-up">
      <h2 className="text-2xl font-heading font-bold text-foreground">Dashboard</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Users" value="1,245" icon={Users} change="5% this week" positive />
        <StatsCard title="Total Agents" value="86" icon={UserPlus} change="3 new" positive />
        <StatsCard title="Total Sales" value="GH₵45,200" icon={ShoppingCart} change="12%" positive />
        <StatsCard title="Revenue" value="GH₵8,900" icon={DollarSign} change="8%" positive />
      </div>

      <GlassCard variant="strong">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Revenue Overview</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="goldGradAdmin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.87 0.17 90)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="oklch(0.87 0.17 90)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.01 260 / 30%)" />
              <XAxis dataKey="month" stroke="oklch(0.65 0.02 260)" fontSize={12} />
              <YAxis stroke="oklch(0.65 0.02 260)" fontSize={12} />
              <Tooltip contentStyle={{ background: "oklch(0.18 0.01 260 / 90%)", border: "1px solid oklch(0.50 0.01 260 / 20%)", borderRadius: "12px", color: "white" }} />
              <Area type="monotone" dataKey="sales" stroke="oklch(0.87 0.17 90)" fill="url(#goldGradAdmin)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}

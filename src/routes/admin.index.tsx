import { useEffect, useState } from "react";
import { StatsCard } from "@/components/StatsCard";
import { GlassCard } from "@/components/GlassCard";
import { Users, UserPlus, ShoppingCart, DollarSign, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type Stats = {
  totalUsers: number;
  totalAgents: number;
  totalOrders: number;
  totalRevenue: number;
  recentOrders: { month: string; sales: number }[];
};

function fmtGHS(n: number) {
  return `GH₵${n.toLocaleString("en-GH", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

export default function AdminOverview() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalAgents: 0,
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: [],
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = async () => {
    const [profilesRes, agentsRes, ordersRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "agent"),
      supabase.from("orders").select("amount, status, created_at").order("created_at", { ascending: false }).limit(500),
    ]);

    const orders = ordersRes.data ?? [];
    const completedOrders = orders.filter((o) => o.status === "completed" || o.status === "delivered");
    const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.amount), 0);

    // Build a 6-month rolling chart from actual orders
    const monthMap = new Map<string, number>();
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthMap.set(d.toLocaleString("default", { month: "short" }), 0);
    }
    for (const o of completedOrders) {
      const d = new Date(o.created_at);
      const key = d.toLocaleString("default", { month: "short" });
      if (monthMap.has(key)) monthMap.set(key, (monthMap.get(key) ?? 0) + Number(o.amount));
    }
    const recentOrders = Array.from(monthMap.entries()).map(([month, sales]) => ({ month, sales }));

    setStats({
      totalUsers: profilesRes.count ?? 0,
      totalAgents: agentsRes.count ?? 0,
      totalOrders: ordersRes.count ?? orders.length,
      totalRevenue,
      recentOrders,
    });
    setLoading(false);
    setLastUpdated(new Date());
  };

  useEffect(() => {
    fetchStats();

    // Realtime subscription — re-fetch whenever orders or profiles change
    const channel = supabase
      .channel("admin-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, fetchStats)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-foreground">Dashboard</h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Loading…"}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Users"
          value={loading ? "…" : stats.totalUsers.toLocaleString()}
          icon={Users}
          change="All registered accounts"
          positive
          variant="yellow"
        />
        <StatsCard
          title="Total Agents"
          value={loading ? "…" : stats.totalAgents.toLocaleString()}
          icon={UserPlus}
          change="Activated agents"
          positive
          variant="dark"
        />
        <StatsCard
          title="Total Orders"
          value={loading ? "…" : stats.totalOrders.toLocaleString()}
          icon={ShoppingCart}
          change="All time"
          positive
        />
        <StatsCard
          title="Revenue"
          value={loading ? "…" : fmtGHS(stats.totalRevenue)}
          icon={DollarSign}
          change="Completed orders"
          positive
          variant="yellow"
        />
      </div>

      <GlassCard variant="strong">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Revenue — Last 6 Months</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.recentOrders}>
              <defs>
                <linearGradient id="goldGradAdmin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="oklch(0.75 0.18 85)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="oklch(0.75 0.18 85)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.85 0.01 260 / 40%)" />
              <XAxis dataKey="month" stroke="oklch(0.50 0.02 260)" fontSize={12} />
              <YAxis stroke="oklch(0.50 0.02 260)" fontSize={12} tickFormatter={(v) => `₵${v}`} />
              <Tooltip
                formatter={(v: number) => [fmtGHS(v), "Revenue"]}
                contentStyle={{ background: "oklch(0.99 0 0 / 95%)", border: "1px solid oklch(0.85 0.01 260 / 50%)", borderRadius: "12px", color: "oklch(0.15 0.01 260)" }}
              />
              <Area type="monotone" dataKey="sales" stroke="oklch(0.75 0.18 85)" fill="url(#goldGradAdmin)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
    </div>
  );
}

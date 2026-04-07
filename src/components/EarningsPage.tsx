import { GlassCard } from "@/components/GlassCard";
import { StatsCard } from "@/components/StatsCard";
import { DollarSign, TrendingUp, ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EarningsPage() {
  const commissions = [
    { desc: "Commission from Kwesi Appiah (sub-agent)", amount: 12.50, date: "Apr 7" },
    { desc: "Direct sale commission - 10GB MTN", amount: 3.50, date: "Apr 7" },
    { desc: "Commission from Akua Boateng (sub-agent)", amount: 8.00, date: "Apr 6" },
    { desc: "Direct sale commission - 5GB AirtelTigo", amount: 1.80, date: "Apr 6" },
    { desc: "Direct sale commission - 20GB MTN", amount: 6.00, date: "Apr 5" },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <h2 className="text-2xl font-heading font-bold text-foreground">Earnings</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard title="Total Earnings" value="GH₵1,250" icon={DollarSign} change="15% this month" positive />
        <StatsCard title="This Week" value="GH₵320" icon={TrendingUp} change="8% vs last week" positive />
        <GlassCard hover className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
            <p className="text-2xl font-heading font-bold text-primary">GH₵2,340</p>
          </div>
          <Button variant="gold" size="sm">
            <ArrowDownToLine className="h-4 w-4" /> Withdraw
          </Button>
        </GlassCard>
      </div>

      <GlassCard variant="strong">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Commission History</h3>
        <div className="space-y-3">
          {commissions.map((c, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-glass-border/50 last:border-0">
              <div>
                <p className="text-sm text-foreground">{c.desc}</p>
                <p className="text-xs text-muted-foreground">{c.date}</p>
              </div>
              <span className="text-primary font-bold">+GH₵{c.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

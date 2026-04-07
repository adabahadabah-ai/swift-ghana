import { GlassCard } from "./GlassCard";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: string;
  positive?: boolean;
}

export function StatsCard({ title, value, icon: Icon, change, positive }: StatsCardProps) {
  return (
    <GlassCard hover className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-heading font-bold text-foreground">{value}</p>
        {change && (
          <p className={`text-xs mt-1 ${positive ? "text-[oklch(0.75_0.15_155)]" : "text-destructive"}`}>
            {positive ? "↑" : "↓"} {change}
          </p>
        )}
      </div>
      <div className="p-3 rounded-xl bg-gold-muted">
        <Icon className="h-5 w-5 text-primary" />
      </div>
    </GlassCard>
  );
}

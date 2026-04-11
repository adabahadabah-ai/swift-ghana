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
    <GlassCard hover className="group relative overflow-hidden">
      <div className="absolute inset-0 bg-radial-glow opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="text-2xl font-heading font-bold text-foreground tracking-tight">{value}</p>
          {change && (
            <p className={`text-xs font-medium ${positive ? "text-success" : "text-destructive"}`}>
              {positive ? "↑" : "↓"} {change}
            </p>
          )}
        </div>
        <div className="p-2.5 rounded-lg bg-gold-muted border border-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
    </GlassCard>
  );
}

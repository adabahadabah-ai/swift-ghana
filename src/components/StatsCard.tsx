import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  change?: string;
  positive?: boolean;
  variant?: "yellow" | "dark" | "default";
}

export function StatsCard({ title, value, icon: Icon, change, positive, variant = "default" }: StatsCardProps) {
  const isDark = variant === "dark";
  const isYellow = variant === "yellow";

  return (
    <div
      className={cn(
        "rounded-xl p-5 transition-all duration-300 hover-lift relative overflow-hidden group",
        isDark && "card-dark",
        isYellow && "card-yellow",
        !isDark && !isYellow && "glass-card-strong"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "p-2 rounded-lg",
          isDark ? "bg-[oklch(0.95_0_0_/_10%)]" : isYellow ? "bg-[oklch(0.15_0.02_260_/_10%)]" : "bg-gold-muted"
        )}>
          <Icon className={cn(
            "h-4 w-4",
            isDark ? "text-[oklch(0.75_0.18_85)]" : isYellow ? "text-[oklch(0.15_0.02_260)]" : "text-primary"
          )} />
        </div>
      </div>
      <p className={cn(
        "text-[11px] uppercase tracking-wider font-medium mb-1",
        isDark ? "text-[oklch(0.65_0_0)]" : isYellow ? "text-[oklch(0.30_0.05_85)]" : "text-muted-foreground"
      )}>
        {title}
      </p>
      <p className={cn(
        "text-2xl font-heading font-bold tracking-tight",
        isDark ? "text-[oklch(0.95_0_0)]" : isYellow ? "text-[oklch(0.12_0.02_260)]" : "text-foreground"
      )}>
        {value}
      </p>
      {change && (
        <p className={cn(
          "text-[10px] mt-1.5 font-medium",
          positive
            ? isDark ? "text-[oklch(0.72_0.19_155)]" : "text-success"
            : "text-destructive"
        )}>
          {positive ? "↑" : "↓"} {change}
        </p>
      )}
    </div>
  );
}

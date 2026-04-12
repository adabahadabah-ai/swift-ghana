import { cn } from "@/lib/utils";
import { Wifi, Radio, Signal } from "lucide-react";
import type { Network } from "@/lib/mock-data";

interface NetworkCardProps {
  network: Network;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

const networkConfig: Record<Network, { icon: typeof Wifi; color: string; selectedBg: string }> = {
  MTN: {
    icon: Wifi,
    color: "text-[oklch(0.75_0.18_85)]",
    selectedBg: "card-yellow",
  },
  AirtelTigo: {
    icon: Radio,
    color: "text-destructive",
    selectedBg: "card-dark",
  },
  Telecel: {
    icon: Signal,
    color: "text-primary",
    selectedBg: "glass-card-strong border-primary/30",
  },
};

export function NetworkCard({ network, selected, onClick, className }: NetworkCardProps) {
  const config = networkConfig[network];
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full rounded-xl p-4 text-center transition-all duration-300 hover-lift cursor-pointer border",
        selected
          ? `${config.selectedBg} ring-2 ring-primary/30`
          : "glass-card hover:border-primary/20",
        className
      )}
    >
      <div className={cn(
        "w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center transition-colors",
        selected ? "bg-[oklch(0.15_0.02_260_/_10%)]" : "bg-gold-muted"
      )}>
        <Icon className={cn("h-5 w-5", config.color)} />
      </div>
      <h3 className="text-sm font-heading font-bold tracking-tight">{network}</h3>
    </button>
  );
}

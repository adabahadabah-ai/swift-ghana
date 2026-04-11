import { cn } from "@/lib/utils";
import { Wifi, Radio, Smartphone } from "lucide-react";
import type { Network } from "@/lib/mock-data";

const networkConfig: Record<Network, { color: string; borderColor: string; icon: typeof Wifi }> = {
  MTN: { color: "oklch(0.87 0.17 90)", borderColor: "oklch(0.87 0.17 90 / 30%)", icon: Wifi },
  AirtelTigo: { color: "oklch(0.65 0.22 25)", borderColor: "oklch(0.65 0.22 25 / 30%)", icon: Radio },
  Telecel: { color: "oklch(0.65 0.20 155)", borderColor: "oklch(0.65 0.20 155 / 30%)", icon: Smartphone },
};

interface NetworkCardProps {
  network: Network;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function NetworkCard({ network, selected, onClick, className }: NetworkCardProps) {
  const config = networkConfig[network];
  const IconComp = config.icon;

  return (
    <button
      onClick={onClick}
      className={cn(
        "glass-card p-5 text-center transition-all duration-300 cursor-pointer group relative overflow-hidden",
        selected && "ring-2 ring-primary scale-[1.02] border-glow",
        !selected && "hover-lift",
        className
      )}
    >
      <div className="absolute inset-0 bg-radial-glow opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative">
        <div
          className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center"
          style={{ background: `color-mix(in oklch, ${config.color} 15%, transparent)` }}
        >
          <IconComp className="h-5 w-5" style={{ color: config.color }} />
        </div>
        <h3 className="text-sm font-heading font-bold text-foreground tracking-tight">{network}</h3>
      </div>
    </button>
  );
}

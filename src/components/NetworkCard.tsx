import { cn } from "@/lib/utils";
import type { Network } from "@/lib/mock-data";

const networkStyles: Record<Network, { bg: string; border: string; icon: string }> = {
  MTN: { bg: "bg-[oklch(0.87_0.17_90/10%)]", border: "border-[oklch(0.87_0.17_90/30%)]", icon: "📶" },
  AirtelTigo: { bg: "bg-[oklch(0.63_0.24_25/10%)]", border: "border-[oklch(0.63_0.24_25/30%)]", icon: "📡" },
  Telecel: { bg: "bg-[oklch(0.60_0.18_155/10%)]", border: "border-[oklch(0.60_0.18_155/30%)]", icon: "📱" },
};

interface NetworkCardProps {
  network: Network;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function NetworkCard({ network, selected, onClick, className }: NetworkCardProps) {
  const style = networkStyles[network];
  return (
    <button
      onClick={onClick}
      className={cn(
        "glass-card p-6 text-center transition-all duration-300 cursor-pointer hover:scale-[1.03]",
        style.bg,
        selected && "ring-2 ring-primary scale-[1.03]",
        !selected && `border ${style.border}`,
        className
      )}
    >
      <div className="text-4xl mb-3">{style.icon}</div>
      <h3 className="text-lg font-heading font-bold text-foreground">{network}</h3>
    </button>
  );
}

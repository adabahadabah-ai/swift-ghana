import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "strong" | "gold" | "glow" | "yellow" | "dark";
  hover?: boolean;
  float?: boolean;
}

export function GlassCard({ className, variant = "default", hover, float, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl p-6 transition-all duration-300",
        variant === "default" && "glass-card",
        variant === "strong" && "glass-card-strong",
        variant === "gold" && "glass-card border-glow",
        variant === "glow" && "glass-card-strong animate-border-glow",
        variant === "yellow" && "card-yellow",
        variant === "dark" && "card-dark",
        hover && "hover-lift cursor-pointer",
        float && "animate-float",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

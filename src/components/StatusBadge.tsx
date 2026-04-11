import { cn } from "@/lib/utils";

const statusStyles = {
  completed: "bg-[oklch(0.65_0.20_155/12%)] text-[oklch(0.72_0.19_155)] border-[oklch(0.65_0.20_155/20%)]",
  pending: "bg-gold-muted text-primary border-primary/20",
  failed: "bg-destructive/10 text-destructive border-destructive/20",
  active: "bg-[oklch(0.65_0.20_155/12%)] text-[oklch(0.72_0.19_155)] border-[oklch(0.65_0.20_155/20%)]",
  blocked: "bg-destructive/10 text-destructive border-destructive/20",
};

export function StatusBadge({ status }: { status: keyof typeof statusStyles }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider border capitalize",
      statusStyles[status]
    )}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

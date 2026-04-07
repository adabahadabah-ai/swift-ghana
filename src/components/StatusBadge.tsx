import { cn } from "@/lib/utils";

const statusStyles = {
  completed: "bg-[oklch(0.60_0.18_155/15%)] text-[oklch(0.75_0.15_155)]",
  pending: "bg-gold-muted text-primary",
  failed: "bg-destructive/15 text-destructive",
  active: "bg-[oklch(0.60_0.18_155/15%)] text-[oklch(0.75_0.15_155)]",
  blocked: "bg-destructive/15 text-destructive",
};

export function StatusBadge({ status }: { status: keyof typeof statusStyles }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize", statusStyles[status])}>
      {status}
    </span>
  );
}

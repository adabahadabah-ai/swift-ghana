import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { agents } from "@/lib/mock-data";
import { StatusBadge } from "@/components/StatusBadge";
import { Copy, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function SubAgentsPage() {
  const copyLink = () => {
    navigator.clipboard.writeText("https://swiftdata.gh/ref/john-mensah");
    toast.success("Referral link copied!");
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Sub-Agents</h2>
          <p className="text-sm text-muted-foreground">Manage your recruited agents</p>
        </div>
        <Button variant="gold" onClick={copyLink}>
          <UserPlus className="h-4 w-4" /> Invite Agent
        </Button>
      </div>

      <GlassCard className="flex items-center gap-3 p-4">
        <div className="flex-1 text-sm text-muted-foreground font-mono bg-glass rounded-lg px-3 py-2 border border-glass-border truncate">
          https://swiftdata.gh/ref/john-mensah
        </div>
        <Button variant="outline" size="sm" onClick={copyLink}>
          <Copy className="h-4 w-4" />
        </Button>
      </GlassCard>

      <GlassCard variant="strong">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-glass-border">
                <th className="text-left py-3 px-2">Name</th>
                <th className="text-left py-3 px-2 hidden sm:table-cell">Phone</th>
                <th className="text-left py-3 px-2">Sales</th>
                <th className="text-left py-3 px-2">Earnings</th>
                <th className="text-left py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id} className="border-b border-glass-border/50 hover:bg-accent/10">
                  <td className="py-3 px-2 font-medium text-foreground">{a.name}</td>
                  <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{a.phone}</td>
                  <td className="py-3 px-2 text-foreground">{a.totalSales}</td>
                  <td className="py-3 px-2 text-primary font-medium">GH₵{a.earnings}</td>
                  <td className="py-3 px-2"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

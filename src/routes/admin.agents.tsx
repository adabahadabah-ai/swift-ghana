import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { agents } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/agents")({
  component: AdminAgentsPage,
});

function AdminAgentsPage() {
  return (
    <div className="space-y-6 animate-fade-up">
      <h2 className="text-2xl font-heading font-bold text-foreground">Agents</h2>
      <GlassCard variant="strong">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-glass-border">
                <th className="text-left py-3 px-2">Name</th>
                <th className="text-left py-3 px-2 hidden sm:table-cell">Email</th>
                <th className="text-left py-3 px-2">Sales</th>
                <th className="text-left py-3 px-2">Sub-Agents</th>
                <th className="text-left py-3 px-2">Earnings</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((a) => (
                <tr key={a.id} className="border-b border-glass-border/50 hover:bg-accent/10">
                  <td className="py-3 px-2 font-medium text-foreground">{a.name}</td>
                  <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{a.email}</td>
                  <td className="py-3 px-2 text-foreground">{a.totalSales}</td>
                  <td className="py-3 px-2 text-foreground">{a.subAgents}</td>
                  <td className="py-3 px-2 text-primary font-medium">GH₵{a.earnings}</td>
                  <td className="py-3 px-2"><StatusBadge status={a.status} /></td>
                  <td className="py-3 px-2 space-x-2">
                    <Button variant="ghost" size="sm" onClick={() => toast.info(`${a.name} demoted`)}>Demote</Button>
                    <Button variant="ghost" size="sm" onClick={() => toast.info(`${a.name} ${a.status === "active" ? "blocked" : "unblocked"}`)}>{a.status === "active" ? "Block" : "Unblock"}</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

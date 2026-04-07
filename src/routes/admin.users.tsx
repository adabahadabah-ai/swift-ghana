import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const users = [
    { id: "U-001", name: "Kwame Asante", email: "kwame@mail.com", phone: "024 555 1234", orders: 12, status: "active" as const },
    { id: "U-002", name: "Ama Serwaa", email: "ama@mail.com", phone: "027 888 5678", orders: 8, status: "active" as const },
    { id: "U-003", name: "Yaw Boateng", email: "yaw@mail.com", phone: "020 123 4567", orders: 2, status: "blocked" as const },
    { id: "U-004", name: "Efua Kumah", email: "efua@mail.com", phone: "024 111 2222", orders: 15, status: "active" as const },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <h2 className="text-2xl font-heading font-bold text-foreground">Users</h2>
      <GlassCard variant="strong">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-glass-border">
                <th className="text-left py-3 px-2">Name</th>
                <th className="text-left py-3 px-2 hidden sm:table-cell">Email</th>
                <th className="text-left py-3 px-2">Phone</th>
                <th className="text-left py-3 px-2">Orders</th>
                <th className="text-left py-3 px-2">Status</th>
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-glass-border/50 hover:bg-accent/10">
                  <td className="py-3 px-2 font-medium text-foreground">{u.name}</td>
                  <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{u.email}</td>
                  <td className="py-3 px-2 text-muted-foreground">{u.phone}</td>
                  <td className="py-3 px-2 text-foreground">{u.orders}</td>
                  <td className="py-3 px-2"><StatusBadge status={u.status} /></td>
                  <td className="py-3 px-2 space-x-2">
                    <Button variant="outline" size="sm" onClick={() => toast.success(`${u.name} promoted to agent`)}>Promote</Button>
                    <Button variant="ghost" size="sm" onClick={() => toast.info(`${u.name} ${u.status === "active" ? "blocked" : "unblocked"}`)}>{u.status === "active" ? "Block" : "Unblock"}</Button>
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

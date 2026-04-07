import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";

export const Route = createFileRoute("/agent/customers")({
  component: CustomersPage,
});

function CustomersPage() {
  const customers = [
    { name: "Kwame Asante", phone: "024 555 1234", orders: 12, lastOrder: "Apr 7" },
    { name: "Ama Serwaa", phone: "027 888 5678", orders: 8, lastOrder: "Apr 6" },
    { name: "Kofi Mensah", phone: "020 123 4567", orders: 5, lastOrder: "Apr 5" },
    { name: "Efua Kumah", phone: "024 111 2222", orders: 3, lastOrder: "Apr 4" },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      <h2 className="text-2xl font-heading font-bold text-foreground">My Customers</h2>
      <GlassCard variant="strong">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-glass-border">
                <th className="text-left py-3 px-2">Name</th>
                <th className="text-left py-3 px-2">Phone</th>
                <th className="text-left py-3 px-2">Orders</th>
                <th className="text-left py-3 px-2">Last Order</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c, i) => (
                <tr key={i} className="border-b border-glass-border/50 hover:bg-accent/10">
                  <td className="py-3 px-2 font-medium text-foreground">{c.name}</td>
                  <td className="py-3 px-2 text-muted-foreground">{c.phone}</td>
                  <td className="py-3 px-2 text-foreground">{c.orders}</td>
                  <td className="py-3 px-2 text-muted-foreground">{c.lastOrder}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

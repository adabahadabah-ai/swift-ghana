import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dataBundles, type Network } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/prices")({
  component: ManagePricesPage,
});

function ManagePricesPage() {
  const [activeNetwork, setActiveNetwork] = useState<Network>("MTN");
  const bundles = dataBundles.filter((b) => b.network === activeNetwork);

  return (
    <div className="space-y-6 animate-fade-up">
      <h2 className="text-2xl font-heading font-bold text-foreground">Manage Prices</h2>

      <div className="flex gap-2">
        {(["MTN", "AirtelTigo", "Telecel"] as Network[]).map((n) => (
          <Button
            key={n}
            variant={activeNetwork === n ? "gold" : "outline"}
            size="sm"
            onClick={() => setActiveNetwork(n)}
          >
            {n}
          </Button>
        ))}
      </div>

      <GlassCard variant="strong">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-glass-border">
                <th className="text-left py-3 px-2">Bundle</th>
                <th className="text-left py-3 px-2">Validity</th>
                <th className="text-left py-3 px-2">Regular Price (GH₵)</th>
                <th className="text-left py-3 px-2">Agent Price (GH₵)</th>
                <th className="text-left py-3 px-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {bundles.map((b) => (
                <tr key={b.id} className="border-b border-glass-border/50">
                  <td className="py-3 px-2 font-medium text-foreground">{b.size}</td>
                  <td className="py-3 px-2 text-muted-foreground">{b.validity}</td>
                  <td className="py-3 px-2">
                    <Input defaultValue={b.regularPrice.toFixed(2)} className="h-8 w-24 bg-glass border-glass-border rounded-lg text-sm" />
                  </td>
                  <td className="py-3 px-2">
                    <Input defaultValue={b.agentPrice.toFixed(2)} className="h-8 w-24 bg-glass border-glass-border rounded-lg text-sm" />
                  </td>
                  <td className="py-3 px-2">
                    <Button variant="outline" size="sm" onClick={() => toast.success(`${b.size} price updated`)}>Save</Button>
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

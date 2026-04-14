import { useState, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { dataBundles, type Network } from "@/lib/mock-data";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { apiPost } from "@/lib/api";

interface PackageSetting {
  id: string;
  network: string;
  package_size: string;
  public_price: number | null;
  agent_price: number | null;
  is_unavailable: boolean;
}

export default function ManagePricesPage() {
  const [activeNetwork, setActiveNetwork] = useState<Network>("MTN");
  const [dbPackages, setDbPackages] = useState<PackageSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [localEdits, setLocalEdits] = useState<Record<string, { publicPrice: string; agentPrice: string; unavailable: boolean }>>({});
  const fetchPackages = async () => {
    const { data } = await supabase.from("global_package_settings").select("*");
    if (data) setDbPackages(data);
    setLoading(false);
  };

  useEffect(() => { fetchPackages(); }, []);

  const bundles = dataBundles.filter((b) => b.network === activeNetwork);

  const getValues = (b: typeof bundles[0]) => {
    const dbMatch = dbPackages.find((d) => d.network === b.network && d.package_size === b.size);
    const localEdit = localEdits[b.id];
    if (localEdit) return localEdit;
    return {
      publicPrice: (dbMatch?.public_price ?? b.regularPrice).toFixed(2),
      agentPrice: (dbMatch?.agent_price ?? b.agentPrice).toFixed(2),
      unavailable: dbMatch?.is_unavailable ?? false,
    };
  };

  const updateLocal = (bundleId: string, field: string, value: string | boolean) => {
    const current = localEdits[bundleId] || getValues(bundles.find((b) => b.id === bundleId)!);
    setLocalEdits({ ...localEdits, [bundleId]: { ...current, [field]: value } });
  };

  const handleSave = async (b: typeof bundles[0]) => {
    const values = getValues(b);
    setSavingId(b.id);
    try {
      await apiPost("/api/admin/update-package-price", {
        network: b.network,
        package_size: b.size,
        public_price: parseFloat(values.publicPrice) || 0,
        agent_price: parseFloat(values.agentPrice) || 0,
        is_unavailable: values.unavailable,
      });
      toast.success(`${b.size} ${b.network} price updated`);
      const newEdits = { ...localEdits };
      delete newEdits[b.id];
      setLocalEdits(newEdits);
      fetchPackages();
    } catch (err) {
      toast.error("Failed to update price");
    }
    setSavingId(null);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-up">
      <h2 className="text-2xl font-heading font-bold text-foreground">Manage Prices</h2>
      <div className="flex gap-2">
        {(["MTN", "AirtelTigo", "Telecel"] as Network[]).map((n) => (
          <Button key={n} variant={activeNetwork === n ? "gold" : "outline"} size="sm" onClick={() => setActiveNetwork(n)}>{n}</Button>
        ))}
      </div>
      <GlassCard variant="strong">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-glass-border">
                <th className="text-left py-3 px-2">Bundle</th>
                <th className="text-left py-3 px-2">Validity</th>
                <th className="text-left py-3 px-2">Public Price (GH₵)</th>
                <th className="text-left py-3 px-2">Agent Price (GH₵)</th>
                <th className="text-left py-3 px-2">Available</th>
                <th className="text-left py-3 px-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {bundles.map((b) => {
                const vals = getValues(b);
                return (
                  <tr key={b.id} className="border-b border-glass-border/50">
                    <td className="py-3 px-2 font-medium text-foreground">{b.size}</td>
                    <td className="py-3 px-2 text-muted-foreground">{b.validity}</td>
                    <td className="py-3 px-2">
                      <Input value={vals.publicPrice} onChange={(e) => updateLocal(b.id, "publicPrice", e.target.value)} className="h-8 w-24 bg-glass border-glass-border rounded-lg text-sm" />
                    </td>
                    <td className="py-3 px-2">
                      <Input value={vals.agentPrice} onChange={(e) => updateLocal(b.id, "agentPrice", e.target.value)} className="h-8 w-24 bg-glass border-glass-border rounded-lg text-sm" />
                    </td>
                    <td className="py-3 px-2">
                      <input type="checkbox" checked={!vals.unavailable} onChange={(e) => updateLocal(b.id, "unavailable", !e.target.checked)} className="rounded" />
                    </td>
                    <td className="py-3 px-2">
                      <Button variant="outline" size="sm" onClick={() => handleSave(b)} disabled={savingId === b.id}>
                        {savingId === b.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

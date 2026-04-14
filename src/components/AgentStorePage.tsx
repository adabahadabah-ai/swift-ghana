import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Network } from "@/lib/mock-data";
import { toast } from "sonner";
import { Loader2, Globe, Copy, ExternalLink, Save, Eye } from "lucide-react";
import { apiPost } from "@/lib/api";

interface StorePackage {
  network: string;
  package_size: string;
  selling_price: number;
}

interface DbGlobalPackage {
  network: string;
  package_size: string;
  agent_price: number | null;
  public_price: number | null;
  is_unavailable: boolean;
  validity: string;
}

export default function AgentStorePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeNetwork, setActiveNetwork] = useState<Network>("MTN");

  const [store, setStore] = useState({
    store_name: "",
    store_description: "",
    support_phone: "",
    whatsapp_link: "",
    is_published: false,
  });

  const [storePackages, setStorePackages] = useState<StorePackage[]>([]);
  const [globalPackages, setGlobalPackages] = useState<DbGlobalPackage[]>([]);
  const [localPrices, setLocalPrices] = useState<Record<string, string>>({});


  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("agent_stores").select("*").eq("agent_id", user.id).single(),
      supabase.from("agent_store_packages").select("*").eq("agent_id", user.id),
      supabase.from("global_package_settings").select("*"),
    ]).then(([storeRes, pkgRes, globalRes]) => {
      if (storeRes.data) {
        setStore({
          store_name: storeRes.data.store_name,
          store_description: storeRes.data.store_description,
          support_phone: storeRes.data.support_phone,
          whatsapp_link: storeRes.data.whatsapp_link,
          is_published: storeRes.data.is_published,
        });
      }
      if (pkgRes.data) setStorePackages(pkgRes.data);
      if (globalRes.data) setGlobalPackages(globalRes.data);
      setLoading(false);
    });
  }, [user]);

  const getAgentPrice = (network: string, size: string) => {
    const global = globalPackages.find((g) => g.network === network && g.package_size === size);
    return global?.agent_price ?? 0;
  };

  const getSellingPrice = (network: string, size: string) => {
    const key = `${network}-${size}`;
    if (localPrices[key] !== undefined) return localPrices[key];
    const pkg = storePackages.find((p) => p.network === network && p.package_size === size);
    if (pkg) return pkg.selling_price.toString();
    const global = globalPackages.find((g) => g.network === network && g.package_size === size);
    return (global?.public_price ?? 0).toString();
  };

  const getProfit = (network: string, size: string) => {
    const selling = parseFloat(getSellingPrice(network, size)) || 0;
    const cost = getAgentPrice(network, size);
    return selling - cost;
  };

  const handleSaveStore = async () => {
    if (!store.store_name.trim()) {
      toast.error("Please enter a store name");
      return;
    }
    setSaving(true);
    try {
      await apiPost("/api/agent/update-store", store);
      toast.success("Store settings saved!");
    } catch (err) {
      toast.error("Failed to save store settings");
    }
    setSaving(false);
  };

  const handleSavePackages = async () => {
    if (!user) return;
    setSaving(true);

    const bundles = globalPackages.filter((g) => g.network === activeNetwork && !g.is_unavailable);
    const upserts = bundles.map((g) => ({
      agent_id: user.id,
      network: g.network,
      package_size: g.package_size,
      selling_price: parseFloat(getSellingPrice(g.network, g.package_size)) || 0,
    }));

    for (const pkg of upserts) {
      await supabase.from("agent_store_packages").upsert(pkg, {
        onConflict: "agent_id,network,package_size",
      });
    }

    // Refresh
    const { data } = await supabase.from("agent_store_packages").select("*").eq("agent_id", user.id);
    if (data) setStorePackages(data);
    setLocalPrices({});
    toast.success(`${activeNetwork} prices saved!`);
    setSaving(false);
  };

  const storeUrl = typeof window !== "undefined" && user?.id
    ? `${window.location.origin}/store/${user.id}`
    : "";

  const copyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    toast.success("Store link copied!");
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const bundles = dataBundles.filter((b) => b.network === activeNetwork);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-foreground">My Store</h2>
        {store.is_published && (
          <Button variant="outline" size="sm" asChild>
            <a href={storeUrl} target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4" /> Preview Store
            </a>
          </Button>
        )}
      </div>

      {/* Store Link */}
      {store.is_published && (
        <GlassCard variant="strong" className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-1">Your public store link</p>
            <p className="font-mono text-primary font-medium text-sm break-all">{storeUrl}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="gold" size="sm" onClick={copyLink}>
              <Copy className="h-4 w-4" /> Copy
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={storeUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Store Details */}
      <GlassCard variant="strong">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" /> Store Settings
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Store Name *</label>
            <Input
              value={store.store_name}
              onChange={(e) => setStore({ ...store, store_name: e.target.value })}
              placeholder="My Data Store"
              className="h-11 bg-glass border-glass-border rounded-xl"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Support Phone</label>
            <Input
              value={store.support_phone}
              onChange={(e) => setStore({ ...store, support_phone: e.target.value })}
              placeholder="024 XXX XXXX"
              className="h-11 bg-glass border-glass-border rounded-xl"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-muted-foreground mb-1.5 block">Store Description</label>
            <textarea
              value={store.store_description}
              onChange={(e) => setStore({ ...store, store_description: e.target.value })}
              placeholder="Tell customers about your store..."
              rows={3}
              className="w-full rounded-xl bg-glass border border-glass-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring backdrop-blur-md resize-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm text-muted-foreground mb-1.5 block">WhatsApp Group/Channel Link</label>
            <Input
              value={store.whatsapp_link}
              onChange={(e) => setStore({ ...store, whatsapp_link: e.target.value })}
              placeholder="https://chat.whatsapp.com/..."
              className="h-11 bg-glass border-glass-border rounded-xl"
            />
          </div>
          <div className="sm:col-span-2 flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={store.is_published}
                onChange={(e) => setStore({ ...store, is_published: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-foreground">Publish store (make visible to customers)</span>
            </label>
            <Button variant="gold" onClick={handleSaveStore} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save Settings</>}
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Package Pricing */}
      <GlassCard variant="strong">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Package Pricing</h3>
        <p className="text-xs text-muted-foreground mb-4">Set your selling prices. Your profit = Selling Price - Your Cost (agent price).</p>

        <div className="flex gap-2 mb-4">
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-muted-foreground text-xs border-b border-glass-border">
                <th className="text-left py-3 px-2">Bundle</th>
                <th className="text-left py-3 px-2">Your Cost</th>
                <th className="text-left py-3 px-2">Selling Price</th>
                <th className="text-left py-3 px-2">Profit</th>
              </tr>
            </thead>
            <tbody>
              {bundles.map((g) => {
                const profit = getProfit(g.network, g.package_size);
                return (
                  <tr key={g.package_size} className="border-b border-glass-border/50">
                    <td className="py-3 px-2">
                      <span className="font-medium text-foreground">{g.package_size}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{g.validity ?? "30 days"}</span>
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">GH₵{getAgentPrice(g.network, g.package_size).toFixed(2)}</td>
                    <td className="py-3 px-2">
                      <Input
                        type="number"
                        value={getSellingPrice(g.network, g.package_size)}
                        onChange={(e) => setLocalPrices({ ...localPrices, [`${g.network}-${g.package_size}`]: e.target.value })}
                        className="h-8 w-24 bg-glass border-glass-border rounded-lg text-sm"
                        step="0.01"
                      />
                    </td>
                    <td className={`py-3 px-2 font-bold ${profit >= 0 ? "text-[oklch(0.60_0.18_155)]" : "text-destructive"}`}>
                      {profit >= 0 ? "+" : ""}GH₵{profit.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="gold" onClick={handleSavePackages} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save {activeNetwork} Prices</>}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}

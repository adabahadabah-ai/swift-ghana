import { useState, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { type Network } from "@/lib/mock-data";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { apiPost } from "@/lib/api";

interface PackageSetting {
  id: string;
  network: string;
  package_size: string;
  public_price: number | null;
  agent_price: number | null;
  is_unavailable: boolean;
  validity: string;
}

const NETWORKS: Network[] = ["MTN", "AirtelTigo", "Telecel"];

const emptyForm = { package_size: "", public_price: "", agent_price: "", validity: "No Expiry" };

export default function ManagePricesPage() {
  const [activeNetwork, setActiveNetwork] = useState<Network>("MTN");
  const [packages, setPackages] = useState<PackageSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [localEdits, setLocalEdits] = useState<Record<string, { publicPrice: string; agentPrice: string; validity: string; unavailable: boolean }>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(emptyForm);
  const [adding, setAdding] = useState(false);

  const fetchPackages = async () => {
    const { data } = await supabase.from("global_package_settings").select("*").order("network").order("package_size");
    if (data) setPackages(data as PackageSetting[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchPackages();
    const channel = supabase
      .channel("admin_packages_rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "global_package_settings" }, () => fetchPackages())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = packages.filter((p) => p.network === activeNetwork);

  const getEdits = (p: PackageSetting) => {
    const e = localEdits[p.id];
    if (e) return e;
    return {
      publicPrice: (p.public_price ?? 0).toFixed(2),
      agentPrice: (p.agent_price ?? 0).toFixed(2),
      validity: p.validity ?? "30 days",
      unavailable: p.is_unavailable,
    };
  };

  const updateLocal = (id: string, field: string, value: string | boolean) => {
    const pkg = packages.find((p) => p.id === id)!;
    setLocalEdits((prev) => ({ ...prev, [id]: { ...getEdits(pkg), [field]: value } }));
  };

  const handleSave = async (p: PackageSetting) => {
    const vals = getEdits(p);
    setSavingId(p.id);
    try {
      await apiPost("/api/admin/update-package-price", {
        network: p.network,
        package_size: p.package_size,
        public_price: parseFloat(vals.publicPrice) || 0,
        agent_price: parseFloat(vals.agentPrice) || 0,
        is_unavailable: vals.unavailable,
      });
      // update validity separately
      await supabase.from("global_package_settings").update({ validity: vals.validity }).eq("id", p.id);
      toast.success(`${p.package_size} ${p.network} updated`);
      setLocalEdits((prev) => { const n = { ...prev }; delete n[p.id]; return n; });
    } catch {
      toast.error("Failed to save changes");
    }
    setSavingId(null);
  };

  const handleDelete = async (p: PackageSetting) => {
    if (!confirm(`Delete ${p.package_size} ${p.network}? This cannot be undone.`)) return;
    setDeletingId(p.id);
    try {
      await apiPost("/api/admin/delete-package", { id: p.id });
      toast.success(`${p.package_size} ${p.network} deleted`);
    } catch {
      toast.error("Failed to delete package");
    }
    setDeletingId(null);
  };

  const handleAdd = async () => {
    if (!addForm.package_size.trim()) return toast.error("Package size is required");
    const pub = parseFloat(addForm.public_price);
    const agt = parseFloat(addForm.agent_price);
    if (isNaN(pub) || isNaN(agt)) return toast.error("Enter valid prices");
    setAdding(true);
    try {
      await apiPost("/api/admin/create-package", {
        network: activeNetwork,
        package_size: addForm.package_size.trim(),
        public_price: pub,
        agent_price: agt,
        validity: addForm.validity.trim() || "30 days",
      });
      toast.success(`${addForm.package_size} ${activeNetwork} package added`);
      setAddForm(emptyForm);
      setShowAddForm(false);
    } catch {
      toast.error("Failed to add package");
    }
    setAdding(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-foreground">Manage Data Packages</h2>
        <Button variant="gold" size="sm" onClick={() => setShowAddForm((v) => !v)}>
          <Plus className="h-4 w-4 mr-1" /> Add Package
        </Button>
      </div>

      {showAddForm && (
        <GlassCard variant="strong">
          <h3 className="text-base font-semibold text-foreground mb-4">New Package — {activeNetwork}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Size (e.g. 5GB)</Label>
              <Input value={addForm.package_size} onChange={(e) => setAddForm({ ...addForm, package_size: e.target.value })} placeholder="5GB" className="h-8 bg-glass border-glass-border rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Public Price (GH₵)</Label>
              <Input type="number" min="0" step="0.01" value={addForm.public_price} onChange={(e) => setAddForm({ ...addForm, public_price: e.target.value })} placeholder="20.00" className="h-8 bg-glass border-glass-border rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Agent Price (GH₵)</Label>
              <Input type="number" min="0" step="0.01" value={addForm.agent_price} onChange={(e) => setAddForm({ ...addForm, agent_price: e.target.value })} placeholder="16.00" className="h-8 bg-glass border-glass-border rounded-lg text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Validity</Label>
              <Input value={addForm.validity} onChange={(e) => setAddForm({ ...addForm, validity: e.target.value })} placeholder="30 days" className="h-8 bg-glass border-glass-border rounded-lg text-sm" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="gold" size="sm" onClick={handleAdd} disabled={adding}>
              {adding ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
              Add
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setShowAddForm(false); setAddForm(emptyForm); }}>Cancel</Button>
          </div>
        </GlassCard>
      )}

      <div className="flex gap-2">
        {NETWORKS.map((n) => (
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
                <th className="text-left py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">No packages yet. Click "Add Package" to create one.</td></tr>
              )}
              {filtered.map((p) => {
                const vals = getEdits(p);
                return (
                  <tr key={p.id} className="border-b border-glass-border/50">
                    <td className="py-3 px-2 font-medium text-foreground">{p.package_size}</td>
                    <td className="py-3 px-2">
                      <Input value={vals.validity} onChange={(e) => updateLocal(p.id, "validity", e.target.value)} className="h-8 w-24 bg-glass border-glass-border rounded-lg text-sm" />
                    </td>
                    <td className="py-3 px-2">
                      <Input type="number" min="0" step="0.01" value={vals.publicPrice} onChange={(e) => updateLocal(p.id, "publicPrice", e.target.value)} className="h-8 w-24 bg-glass border-glass-border rounded-lg text-sm" />
                    </td>
                    <td className="py-3 px-2">
                      <Input type="number" min="0" step="0.01" value={vals.agentPrice} onChange={(e) => updateLocal(p.id, "agentPrice", e.target.value)} className="h-8 w-24 bg-glass border-glass-border rounded-lg text-sm" />
                    </td>
                    <td className="py-3 px-2">
                      <input type="checkbox" checked={!vals.unavailable} onChange={(e) => updateLocal(p.id, "unavailable", !e.target.checked)} className="rounded" />
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => handleSave(p)} disabled={savingId === p.id}>
                          {savingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(p)} disabled={deletingId === p.id} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                          {deletingId === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                        </Button>
                      </div>
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

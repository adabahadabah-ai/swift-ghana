import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/StatusBadge";
import { type Network } from "@/lib/mock-data";
import { toast } from "sonner";
import { Loader2, Save, Copy, UserPlus, Settings } from "lucide-react";

export default function ManageSubAgentsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"agents" | "pricing">("agents");
  const [activeNetwork, setActiveNetwork] = useState<Network>("MTN");
  const [subAgents, setSubAgents] = useState<any[]>([]);
  const [subAgentPackages, setSubAgentPackages] = useState<any[]>([]);
  const [globalPackages, setGlobalPackages] = useState<any[]>([]);
  const [localPrices, setLocalPrices] = useState<Record<string, string>>({});

  const referralLink = typeof window !== "undefined"
    ? `${window.location.origin}/agent-signup?ref=${user?.id?.slice(0, 8) || "agent"}`
    : "";

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("sub_agents").select("*").eq("parent_agent_id", user.id),
      supabase.from("sub_agent_packages").select("*").eq("agent_id", user.id),
      supabase.from("global_package_settings").select("*"),
    ]).then(async ([saRes, sapRes, gRes]) => {
      if (saRes.data && saRes.data.length > 0) {
        const userIds = saRes.data.map((sa: any) => sa.sub_agent_user_id);
        const { data: profiles } = await supabase.from("profiles").select("id, full_name, phone, email").in("id", userIds);
        const merged = saRes.data.map((sa: any) => ({
          ...sa,
          profile: profiles?.find((p: any) => p.id === sa.sub_agent_user_id),
        }));
        setSubAgents(merged);
      }
      if (sapRes.data) setSubAgentPackages(sapRes.data);
      if (gRes.data) setGlobalPackages(gRes.data);
      setLoading(false);
    });
  }, [user]);

  const getAgentPrice = (network: string, size: string) => {
    const global = globalPackages.find((g: any) => g.network === network && g.package_size === size);
    return global?.agent_price ?? 0;
  };

  const getSubAgentPrice = (network: string, size: string) => {
    const key = `${network}-${size}`;
    if (localPrices[key] !== undefined) return localPrices[key];
    const pkg = subAgentPackages.find((p: any) => p.network === network && p.package_size === size);
    if (pkg) return pkg.sub_agent_price.toString();
    // Default to slightly above agent price
    const agentPrice = getAgentPrice(network, size);
    return (agentPrice * 1.05).toFixed(2);
  };

  const handleSavePrices = async () => {
    if (!user) return;
    setSaving(true);
    const bundles = globalPackages.filter((g: any) => g.network === activeNetwork && !g.is_unavailable);
    for (const g of bundles) {
      const price = parseFloat(getSubAgentPrice(g.network, g.package_size)) || 0;
      await supabase.from("sub_agent_packages").upsert({
        agent_id: user.id,
        network: g.network,
        package_size: g.package_size,
        sub_agent_price: price,
      }, { onConflict: "agent_id,network,package_size" });
    }
    const { data } = await supabase.from("sub_agent_packages").select("*").eq("agent_id", user.id);
    if (data) setSubAgentPackages(data);
    setLocalPrices({});
    toast.success(`${activeNetwork} sub-agent prices saved!`);
    setSaving(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  const bundles = dataBundles.filter((b) => b.network === activeNetwork);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-foreground">Manage Sub-Agents</h2>
        <Button variant="gold" onClick={copyLink}>
          <UserPlus className="h-4 w-4" /> Invite
        </Button>
      </div>

      {/* Referral Link */}
      <GlassCard className="flex items-center gap-3 p-4">
        <div className="flex-1 text-sm text-muted-foreground font-mono bg-glass rounded-lg px-3 py-2 border border-glass-border truncate">
          {referralLink}
        </div>
        <Button variant="outline" size="sm" onClick={copyLink}>
          <Copy className="h-4 w-4" />
        </Button>
      </GlassCard>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button variant={activeTab === "agents" ? "gold" : "outline"} size="sm" onClick={() => setActiveTab("agents")}>
          <UserPlus className="h-4 w-4" /> Sub-Agents
        </Button>
        <Button variant={activeTab === "pricing" ? "gold" : "outline"} size="sm" onClick={() => setActiveTab("pricing")}>
          <Settings className="h-4 w-4" /> Pricing
        </Button>
      </div>

      {activeTab === "agents" && (
        <GlassCard variant="strong">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs border-b border-glass-border">
                  <th className="text-left py-3 px-2">Name</th>
                  <th className="text-left py-3 px-2 hidden sm:table-cell">Phone</th>
                  <th className="text-left py-3 px-2 hidden sm:table-cell">Email</th>
                  <th className="text-left py-3 px-2">Joined</th>
                  <th className="text-left py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {subAgents.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No sub-agents yet. Share your referral link to start recruiting!
                    </td>
                  </tr>
                ) : (
                  subAgents.map((sa) => (
                    <tr key={sa.id} className="border-b border-glass-border/50 hover:bg-accent/10">
                      <td className="py-3 px-2 font-medium text-foreground">{sa.profile?.full_name || "Unknown"}</td>
                      <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{sa.profile?.phone || "-"}</td>
                      <td className="py-3 px-2 text-muted-foreground hidden sm:table-cell">{sa.profile?.email || "-"}</td>
                      <td className="py-3 px-2 text-muted-foreground">{new Date(sa.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-2"><StatusBadge status={sa.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      )}

      {activeTab === "pricing" && (
        <GlassCard variant="strong">
          <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Sub-Agent Pricing</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Set the prices your sub-agents will pay. They can then set their own selling prices for customers.
          </p>

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
                  <th className="text-left py-3 px-2">Sub-Agent Price</th>
                  <th className="text-left py-3 px-2">Your Profit</th>
                </tr>
              </thead>
              <tbody>
                {bundles.map((g: any) => {
                  const agentCost = getAgentPrice(g.network, g.package_size);
                  const subPrice = parseFloat(getSubAgentPrice(g.network, g.package_size)) || 0;
                  const profit = subPrice - agentCost;
                  return (
                    <tr key={g.id} className="border-b border-glass-border/50">
                      <td className="py-3 px-2 font-medium text-foreground">{g.package_size}</td>
                      <td className="py-3 px-2 text-muted-foreground">GH₵{agentCost.toFixed(2)}</td>
                      <td className="py-3 px-2">
                        <Input
                          type="number"
                          value={getSubAgentPrice(g.network, g.package_size)}
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
            <Button variant="gold" onClick={handleSavePrices} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save Prices</>}
            </Button>
          </div>
        </GlassCard>
      )}
    </div>
  );
}

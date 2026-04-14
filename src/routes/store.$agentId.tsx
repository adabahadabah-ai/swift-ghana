import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import BuyDataFlow from "@/components/BuyDataFlow";
import { Loader2 } from "lucide-react";

export default function StoreAgentPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const id = agentId ?? "";
  const [loading, setLoading] = useState(true);
  const [storeName, setStoreName] = useState("Agent Store");
  const [published, setPublished] = useState(false);
  const [sellingMap, setSellingMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      const { data: store } = await supabase
        .from("agent_stores")
        .select("store_name, is_published")
        .eq("agent_id", id)
        .maybeSingle();

      const { data: pkgs } = await supabase
        .from("agent_store_packages")
        .select("network, package_size, selling_price")
        .eq("agent_id", id);

      if (cancelled) return;

      if (store?.store_name) setStoreName(store.store_name);
      setPublished(!!store?.is_published);

      const map: Record<string, number> = {};
      for (const p of pkgs ?? []) {
        map[`${p.network}|${p.package_size}`] = Number(p.selling_price);
      }
      setSellingMap(map);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Invalid store link</div>;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!published) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <p className="text-lg font-heading font-semibold text-foreground">This store is not published yet</p>
        <p className="text-sm text-muted-foreground mt-2">Ask the agent to publish their store from the agent dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="text-center pt-8 pb-4 px-4">
        <div className="w-16 h-16 rounded-full gold-gradient mx-auto flex items-center justify-center text-2xl font-bold text-primary-foreground mb-3">
          {storeName.charAt(0).toUpperCase()}
        </div>
      </div>
      <BuyDataFlow storeName={storeName} agentId={id} agentSellingPrices={sellingMap} />
      <div className="text-center pb-8 text-xs text-muted-foreground">
        Powered by <span className="text-primary font-medium">SwiftData Ghana</span>
      </div>
    </div>
  );
}

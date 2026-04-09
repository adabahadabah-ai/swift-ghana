import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import BuyDataFlow from "@/components/BuyDataFlow";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/agent/buy")({
  component: AgentBuyPage,
});

function AgentBuyPage() {
  const { user } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase.from("wallets").select("balance").eq("agent_id", user.id).single().then(({ data }) => {
      if (data) setWalletBalance(Number(data.balance));
      setLoading(false);
    });
  }, [user]);

  const handleWalletPurchase = (amount: number) => {
    // In production this would be a server function that atomically deducts
    setWalletBalance((prev) => prev - amount);
    toast.success(`GH₵${amount.toFixed(2)} deducted from wallet`);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <BuyDataFlow
      isAgent
      useWallet
      walletBalance={walletBalance}
      onWalletPurchase={handleWalletPurchase}
    />
  );
}

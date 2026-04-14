import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import BuyDataFlow from "@/components/BuyDataFlow";
import { Loader2 } from "lucide-react";

export default function AgentBuyPage() {
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
    setWalletBalance((prev) => prev - amount);
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

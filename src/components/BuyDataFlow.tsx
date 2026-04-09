import { useState, useEffect } from "react";
import { Navbar, Footer } from "@/components/LandingPage";
import { NetworkCard } from "@/components/NetworkCard";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SuccessModal } from "@/components/SuccessModal";
import { supabase } from "@/integrations/supabase/client";
import { dataBundles, type Network, type DataBundle } from "@/lib/mock-data";
import { Zap, X } from "lucide-react";
import { toast } from "sonner";

interface BuyDataFlowProps {
  isAgent?: boolean;
  storeName?: string;
  useWallet?: boolean;
  walletBalance?: number;
  onWalletPurchase?: (amount: number) => void;
}

interface DbPackage {
  id: string;
  network: string;
  package_size: string;
  public_price: number | null;
  agent_price: number | null;
  is_unavailable: boolean;
}

export default function BuyDataFlow({ isAgent = false, storeName, useWallet = false, walletBalance = 0, onWalletPurchase }: BuyDataFlowProps) {
  const [network, setNetwork] = useState<Network | null>(null);
  const [phone, setPhone] = useState("");
  const [selectedBundle, setSelectedBundle] = useState<DataBundle | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [dbPackages, setDbPackages] = useState<DbPackage[]>([]);

  useEffect(() => {
    supabase.from("global_package_settings").select("*").then(({ data }) => {
      if (data) setDbPackages(data);
    });
  }, []);

  // Merge DB prices with mock data
  const getBundles = (): DataBundle[] => {
    if (!network) return [];
    const mockBundles = dataBundles.filter((b) => b.network === network);
    return mockBundles.map((b) => {
      const dbMatch = dbPackages.find((d) => d.network === b.network && d.package_size === b.size);
      if (dbMatch) {
        if (dbMatch.is_unavailable) return null;
        return {
          ...b,
          regularPrice: dbMatch.public_price ?? b.regularPrice,
          agentPrice: dbMatch.agent_price ?? b.agentPrice,
        };
      }
      return b;
    }).filter(Boolean) as DataBundle[];
  };

  const bundles = getBundles();

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  };

  const price = (b: DataBundle) => isAgent ? b.agentPrice : b.regularPrice;

  const handleBundleSelect = (b: DataBundle) => {
    setSelectedBundle(b);
    setShowPhoneDialog(true);
    setPhone("");
  };

  const handleConfirmPurchase = () => {
    if (!phone || phone.replace(/\s/g, "").length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    if (useWallet && onWalletPurchase && selectedBundle) {
      const cost = price(selectedBundle);
      if (walletBalance < cost) {
        toast.error("Insufficient wallet balance. Please top up.");
        return;
      }
      onWalletPurchase(cost);
      setShowPhoneDialog(false);
      setShowSuccess(true);
      return;
    }

    // Paystack payment for non-wallet purchases
    handlePaystackPayment();
  };

  const handlePaystackPayment = () => {
    if (!selectedBundle) return;
    const amount = price(selectedBundle) * 100; // Paystack uses pesewas

    const handler = (window as any).PaystackPop?.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder",
      amount,
      currency: "GHS",
      email: "customer@swiftdata.gh",
      metadata: {
        phone: phone.replace(/\s/g, ""),
        network: selectedBundle.network,
        bundle: selectedBundle.size,
      },
      callback: (response: { reference: string }) => {
        console.log("Payment successful:", response.reference);
        setShowPhoneDialog(false);
        setShowSuccess(true);
      },
      onClose: () => {
        toast.info("Payment cancelled");
      },
    });

    if (handler) {
      handler.openIframe();
    } else {
      // Fallback: simulate payment if Paystack not loaded
      toast.info("Processing payment...");
      setTimeout(() => {
        setShowPhoneDialog(false);
        setShowSuccess(true);
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen">
      {!storeName && !isAgent && <Navbar />}

      <div className={`${!storeName && !isAgent ? "pt-24" : "pt-4"} pb-16 px-4 max-w-4xl mx-auto`}>
        {storeName && (
          <div className="text-center mb-8">
            <h1 className="text-2xl font-heading font-bold text-foreground">{storeName}'s Store</h1>
            <p className="text-xs text-muted-foreground mt-1">Powered by SwiftData Ghana</p>
          </div>
        )}

        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-2">
            {isAgent ? "Buy Data (Agent Prices)" : "Buy Data Bundle"}
          </h1>
          <p className="text-muted-foreground">Select your network and bundle below</p>
          {useWallet && (
            <p className="text-sm text-primary font-medium mt-2">Wallet Balance: GH₵{walletBalance.toFixed(2)}</p>
          )}
        </div>

        {/* Step 1: Network */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">1. Select Network</h2>
          <div className="grid grid-cols-3 gap-4">
            {(["MTN", "AirtelTigo", "Telecel"] as Network[]).map((n) => (
              <NetworkCard key={n} network={n} selected={network === n} onClick={() => { setNetwork(n); setSelectedBundle(null); }} />
            ))}
          </div>
        </div>

        {/* Step 2: Bundle - clicking opens phone dialog */}
        {network && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">2. Choose Bundle</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {bundles.map((b) => (
                <GlassCard
                  key={b.id}
                  hover
                  className="text-center cursor-pointer relative"
                  onClick={() => handleBundleSelect(b)}
                >
                  {b.popular && (
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold gold-gradient text-primary-foreground">POPULAR</span>
                  )}
                  {b.cheapest && (
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[oklch(0.60_0.18_155)] text-foreground">BEST VALUE</span>
                  )}
                  <p className="text-2xl font-heading font-bold text-foreground">{b.size}</p>
                  <p className="text-xs text-muted-foreground mt-1">{b.validity}</p>
                  <div className="mt-3">
                    <span className="text-xl font-bold text-primary">GH₵{price(b).toFixed(2)}</span>
                    {isAgent && (
                      <span className="text-xs text-muted-foreground line-through ml-2">GH₵{b.regularPrice.toFixed(2)}</span>
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}
      </div>

      {!storeName && !isAgent && <Footer />}

      {/* Phone Number Dialog */}
      {showPhoneDialog && selectedBundle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowPhoneDialog(false)} />
          <div className="relative w-full max-w-md">
            <GlassCard variant="strong" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-heading font-bold text-foreground">Complete Purchase</h3>
                <button onClick={() => setShowPhoneDialog(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="glass-card p-4 rounded-xl mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Bundle</p>
                    <p className="text-lg font-heading font-bold text-foreground">{selectedBundle.size} {selectedBundle.network}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="text-2xl font-heading font-bold text-primary">GH₵{price(selectedBundle).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Recipient Phone Number</label>
                <Input
                  placeholder="024 XXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  className="h-12 text-lg bg-glass border-glass-border backdrop-blur-md rounded-xl"
                  autoFocus
                />
              </div>

              {phone && phone.replace(/\s/g, "").length >= 10 && (
                <div className="glass-card p-4 rounded-xl mb-6">
                  <p className="text-xs text-muted-foreground mb-1">Sending to</p>
                  <p className="text-foreground font-medium">{phone}</p>
                  <p className="text-xs text-muted-foreground">{selectedBundle.size} {selectedBundle.network} • GH₵{price(selectedBundle).toFixed(2)}</p>
                </div>
              )}

              <Button variant="hero" size="xl" className="w-full" onClick={handleConfirmPurchase}>
                <Zap className="h-5 w-5" />
                {useWallet ? "Pay from Wallet" : "Pay with Paystack"}
              </Button>
            </GlassCard>
          </div>
        </div>
      )}

      <SuccessModal
        open={showSuccess}
        onClose={() => { setShowSuccess(false); setSelectedBundle(null); setPhone(""); setNetwork(null); setShowPhoneDialog(false); }}
        phone={phone}
        bundle={selectedBundle?.size}
        network={selectedBundle?.network}
      />
    </div>
  );
}

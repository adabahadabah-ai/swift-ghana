import { useState, useEffect } from "react";
import { Navbar, Footer } from "@/components/LandingPage";
import { NetworkCard } from "@/components/NetworkCard";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SuccessModal } from "@/components/SuccessModal";
import { supabase } from "@/integrations/supabase/client";
import { dataBundles, type Network, type DataBundle } from "@/lib/mock-data";
import { Zap, X, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { processDataOrder, processWalletPurchase } from "@/server/order.functions";

interface BuyDataFlowProps {
  isAgent?: boolean;
  storeName?: string;
  useWallet?: boolean;
  walletBalance?: number;
  onWalletPurchase?: (amount: number) => void;
  agentId?: string;
}

interface DbPackage {
  id: string;
  network: string;
  package_size: string;
  public_price: number | null;
  agent_price: number | null;
  is_unavailable: boolean;
}

export default function BuyDataFlow({ isAgent = false, storeName, useWallet = false, walletBalance = 0, onWalletPurchase, agentId }: BuyDataFlowProps) {
  const [network, setNetwork] = useState<Network | null>(null);
  const [phone, setPhone] = useState("");
  const [selectedBundle, setSelectedBundle] = useState<DataBundle | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dbPackages, setDbPackages] = useState<DbPackage[]>([]);

  const processOrderFn = useServerFn(processDataOrder);
  const processWalletFn = useServerFn(processWalletPurchase);

  useEffect(() => {
    supabase.from("global_package_settings").select("*").then(({ data }) => {
      if (data) setDbPackages(data);
    });
  }, []);

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

  const parseSizeGB = (size: string): number => {
    const match = size.match(/(\d+)/);
    return match ? parseInt(match[1]) : 1;
  };

  const mapNetworkForApi = (net: string): string => {
    if (net === "AirtelTigo") return "AIRTELTIGO_ISHARE";
    return net.toUpperCase();
  };

  const handleConfirmPurchase = async () => {
    if (!phone || phone.replace(/\s/g, "").length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (!selectedBundle) return;

    setProcessing(true);

    if (useWallet && onWalletPurchase) {
      const cost = price(selectedBundle);
      if (walletBalance < cost) {
        toast.error("Insufficient wallet balance. Please top up.");
        setProcessing(false);
        return;
      }

      try {
        const result = await processWalletFn({
          data: {
            phone: phone.replace(/\s/g, ""),
            size: parseSizeGB(selectedBundle.size),
            network: selectedBundle.network,
            amount: cost,
            agent_price: selectedBundle.agentPrice,
            package_size: selectedBundle.size,
          },
        });

        if (result.success) {
          onWalletPurchase(cost);
          setShowPhoneDialog(false);
          setShowSuccess(true);
        } else {
          toast.error(result.error || "Data delivery failed");
        }
      } catch (err: any) {
        toast.error(err.message || "Purchase failed");
      }
      setProcessing(false);
      return;
    }

    handlePaystackPayment();
  };

  const handlePaystackPayment = () => {
    if (!selectedBundle) return;
    const amount = price(selectedBundle) * 100;

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
      callback: async (response: { reference: string }) => {
        setProcessing(true);
        try {
          const result = await processOrderFn({
            data: {
              phone: phone.replace(/\s/g, ""),
              size: parseSizeGB(selectedBundle.size),
              network: mapNetworkForApi(selectedBundle.network),
              amount_paid: price(selectedBundle),
              agent_price: selectedBundle.agentPrice,
              paystack_reference: response.reference,
              package_size: selectedBundle.size,
              agent_id: agentId,
            },
          });

          if (result.success) {
            setShowPhoneDialog(false);
            setShowSuccess(true);
          } else {
            toast.error(result.error || "Data delivery failed. Your payment has been recorded.");
          }
        } catch (err: any) {
          toast.error(err.message || "Order processing failed");
        }
        setProcessing(false);
      },
      onClose: () => {
        toast.info("Payment cancelled");
        setProcessing(false);
      },
    });

    if (handler) {
      handler.openIframe();
    } else {
      toast.error("Payment system not loaded. Please refresh the page.");
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen">
      {!storeName && !isAgent && <Navbar />}

      <div className={`${!storeName && !isAgent ? "pt-24" : "pt-4"} pb-16 px-4 max-w-4xl mx-auto relative`}>
        {!storeName && !isAgent && <div className="absolute inset-0 bg-dot-grid opacity-15" />}

        <div className="relative">
          {storeName && (
            <div className="text-center mb-8">
              <h1 className="text-xl font-heading font-bold text-foreground tracking-tight">{storeName}'s Store</h1>
              <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">Powered by SwiftData Ghana</p>
            </div>
          )}

          <div className="text-center mb-10">
            <span className="section-label">{isAgent ? "Agent Pricing" : "Data Bundles"}</span>
            <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mt-3 mb-2 tracking-tight">
              {isAgent ? "Buy Data at Agent Prices" : "Buy Data Bundle"}
            </h1>
            <p className="text-sm text-muted-foreground">Select your network and bundle below</p>
            {useWallet && (
              <div className="chip mt-3">
                <Sparkles className="h-3 w-3" />
                Wallet: GH₵{walletBalance.toFixed(2)}
              </div>
            )}
          </div>

          {/* Step 1: Network */}
          <div className="mb-10">
            <h2 className="section-label mb-4">1. Select Network</h2>
            <div className="grid grid-cols-3 gap-3">
              {(["MTN", "AirtelTigo", "Telecel"] as Network[]).map((n) => (
                <NetworkCard key={n} network={n} selected={network === n} onClick={() => { setNetwork(n); setSelectedBundle(null); }} />
              ))}
            </div>
          </div>

          {/* Step 2: Bundle */}
          {network && (
            <div className="mb-10 animate-fade-up">
              <h2 className="section-label mb-4">2. Choose Bundle</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {bundles.map((b) => (
                  <GlassCard
                    key={b.id}
                    hover
                    className="text-center cursor-pointer relative overflow-hidden group"
                    onClick={() => handleBundleSelect(b)}
                  >
                    {b.popular && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-bold gold-gradient-static text-primary-foreground uppercase tracking-wider">Popular</span>
                    )}
                    {b.cheapest && (
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-bold bg-success/20 text-success border border-success/20 uppercase tracking-wider">Best</span>
                    )}
                    <p className="text-2xl font-heading font-bold text-foreground tracking-tight">{b.size}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider">{b.validity}</p>
                    <div className="mt-3">
                      <span className="text-lg font-bold text-primary">GH₵{price(b).toFixed(2)}</span>
                      {isAgent && (
                        <span className="text-[10px] text-muted-foreground line-through ml-2">GH₵{b.regularPrice.toFixed(2)}</span>
                      )}
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {!storeName && !isAgent && <Footer />}

      {/* Phone Number Dialog */}
      {showPhoneDialog && selectedBundle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={() => !processing && setShowPhoneDialog(false)} />
          <div className="relative w-full max-w-md animate-slide-up">
            <GlassCard variant="strong" className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-heading font-bold text-foreground tracking-tight">Complete Purchase</h3>
                {!processing && (
                  <button onClick={() => setShowPhoneDialog(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="glass-card p-4 rounded-lg mb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Bundle</p>
                    <p className="text-base font-heading font-bold text-foreground tracking-tight">{selectedBundle.size} {selectedBundle.network}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Price</p>
                    <p className="text-xl font-heading font-bold text-primary">GH₵{price(selectedBundle).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Recipient Phone</label>
                <Input
                  placeholder="024 XXX XXXX"
                  value={phone}
                  onChange={(e) => setPhone(formatPhone(e.target.value))}
                  className="h-11 text-base bg-glass border-glass-border rounded-lg font-mono"
                  autoFocus
                  disabled={processing}
                />
              </div>

              {phone && phone.replace(/\s/g, "").length >= 10 && (
                <div className="glass-card p-3 rounded-lg mb-5 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-xs text-muted-foreground">Sending <span className="text-foreground font-medium">{selectedBundle.size} {selectedBundle.network}</span> to <span className="text-foreground font-mono">{phone}</span></span>
                  </div>
                </div>
              )}

              <Button variant="hero" size="lg" className="w-full" onClick={handleConfirmPurchase} disabled={processing}>
                {processing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><Zap className="h-4 w-4" /> {useWallet ? "Pay from Wallet" : "Pay with Paystack"}</>
                )}
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

import { useState } from "react";
import { Navbar, Footer } from "@/components/LandingPage";
import { NetworkCard } from "@/components/NetworkCard";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SuccessModal } from "@/components/SuccessModal";
import { dataBundles, type Network, type DataBundle } from "@/lib/mock-data";
import { Zap } from "lucide-react";
import { toast } from "sonner";

interface BuyDataFlowProps {
  isAgent?: boolean;
  storeName?: string;
}

export default function BuyDataFlow({ isAgent = false, storeName }: BuyDataFlowProps) {
  const [network, setNetwork] = useState<Network | null>(null);
  const [phone, setPhone] = useState("");
  const [selectedBundle, setSelectedBundle] = useState<DataBundle | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const bundles = network ? dataBundles.filter((b) => b.network === network) : [];

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  };

  const handleBuy = () => {
    if (!phone || phone.replace(/\s/g, "").length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }
    if (!selectedBundle) {
      toast.error("Please select a data bundle");
      return;
    }
    setShowSuccess(true);
  };

  const price = (b: DataBundle) => isAgent ? b.agentPrice : b.regularPrice;

  return (
    <div className="min-h-screen">
      {!storeName && <Navbar />}

      <div className="pt-24 pb-16 px-4 max-w-4xl mx-auto">
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

        {/* Step 2: Phone */}
        <div className="mb-10">
          <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">2. Enter Phone Number</h2>
          <Input
            placeholder="024 XXX XXXX"
            value={phone}
            onChange={(e) => setPhone(formatPhone(e.target.value))}
            className="h-12 text-lg bg-glass border-glass-border backdrop-blur-md rounded-xl"
          />
        </div>

        {/* Step 3: Bundle */}
        {network && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-wider">3. Choose Bundle</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {bundles.map((b) => (
                <GlassCard
                  key={b.id}
                  hover
                  className={`text-center cursor-pointer relative ${selectedBundle?.id === b.id ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setSelectedBundle(b)}
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

        {/* Checkout */}
        {selectedBundle && (
          <GlassCard variant="strong" className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl font-heading font-bold text-primary">GH₵{price(selectedBundle).toFixed(2)}</p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>{selectedBundle.size} {selectedBundle.network}</p>
                <p>{phone || "No number"}</p>
              </div>
            </div>
            <Button variant="hero" size="xl" className="w-full" onClick={handleBuy}>
              <Zap className="h-5 w-5" /> Pay with Paystack
            </Button>
          </GlassCard>
        )}
      </div>

      {!storeName && <Footer />}

      <SuccessModal
        open={showSuccess}
        onClose={() => { setShowSuccess(false); setSelectedBundle(null); setPhone(""); setNetwork(null); }}
        phone={phone}
        bundle={selectedBundle?.size}
        network={selectedBundle?.network}
      />
    </div>
  );
}

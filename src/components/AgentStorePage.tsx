import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

export default function AgentStorePage() {
  const storeUrl = "https://swiftdata.gh/store/john";

  const copyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    toast.success("Store link copied!");
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <h2 className="text-2xl font-heading font-bold text-foreground">My Store</h2>

      <GlassCard variant="strong" className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">Your public store link</p>
          <p className="font-mono text-primary font-medium">{storeUrl}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="gold" size="sm" onClick={copyLink}>
            <Copy className="h-4 w-4" /> Copy Link
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={storeUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" /> Preview
            </a>
          </Button>
        </div>
      </GlassCard>

      {/* Store Preview */}
      <GlassCard variant="strong">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Store Preview</h3>
        <div className="rounded-xl border border-glass-border overflow-hidden bg-background">
          <div className="p-6 text-center border-b border-glass-border">
            <div className="w-16 h-16 rounded-full gold-gradient mx-auto flex items-center justify-center text-2xl font-bold text-primary-foreground mb-3">JM</div>
            <h3 className="text-lg font-heading font-bold text-foreground">John Mensah's Store</h3>
            <p className="text-xs text-muted-foreground">Powered by SwiftData Ghana</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-3">
              {["MTN", "AirtelTigo", "Telecel"].map((n) => (
                <div key={n} className="glass-card p-3 text-center rounded-lg">
                  <p className="text-sm font-semibold text-foreground">{n}</p>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-4">Customers can buy data directly from this page</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

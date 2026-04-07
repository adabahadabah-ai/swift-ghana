import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  return (
    <div className="space-y-6 animate-fade-up max-w-2xl">
      <h2 className="text-2xl font-heading font-bold text-foreground">Settings</h2>

      <GlassCard variant="strong">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Platform Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Platform Name</label>
            <Input defaultValue="SwiftData Ghana" className="h-11 bg-glass border-glass-border rounded-xl" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Support Email</label>
            <Input defaultValue="support@swiftdata.gh" className="h-11 bg-glass border-glass-border rounded-xl" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Paystack API Key</label>
            <Input defaultValue="pk_test_•••••••••" type="password" className="h-11 bg-glass border-glass-border rounded-xl" />
          </div>
          <Button variant="gold" onClick={() => toast.success("Settings saved!")}>Save Changes</Button>
        </div>
      </GlassCard>
    </div>
  );
}

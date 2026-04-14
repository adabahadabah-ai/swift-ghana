import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-up max-w-2xl">
      <h2 className="text-2xl font-heading font-bold text-foreground">Settings</h2>

      <GlassCard variant="strong">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Profile</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Name</label>
            <Input defaultValue="John Mensah" className="h-11 bg-glass border-glass-border rounded-xl" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Email</label>
            <Input defaultValue="john@example.com" className="h-11 bg-glass border-glass-border rounded-xl" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Phone</label>
            <Input defaultValue="024 555 0001" className="h-11 bg-glass border-glass-border rounded-xl" />
          </div>
          <Button variant="gold" onClick={() => toast.success("Settings saved!")}>Save Changes</Button>
        </div>
      </GlassCard>

      <GlassCard variant="strong">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Change Password</h3>
        <div className="space-y-4">
          <Input type="password" placeholder="Current password" className="h-11 bg-glass border-glass-border rounded-xl" />
          <Input type="password" placeholder="New password" className="h-11 bg-glass border-glass-border rounded-xl" />
          <Button variant="outline">Update Password</Button>
        </div>
      </GlassCard>
    </div>
  );
}

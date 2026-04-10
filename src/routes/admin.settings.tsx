import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { updateSystemSettings } from "@/server/admin.functions";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    customer_service_number: "",
    support_channel_link: "",
    preferred_provider: "primary",
    holiday_mode_enabled: false,
    holiday_message: "",
    disable_ordering: false,
  });
  const updateSettingsFn = useServerFn(updateSystemSettings);

  useEffect(() => {
    supabase.from("system_settings").select("*").eq("id", 1).single().then(({ data }) => {
      if (data) {
        setSettings({
          customer_service_number: data.customer_service_number,
          support_channel_link: data.support_channel_link,
          preferred_provider: data.preferred_provider,
          holiday_mode_enabled: data.holiday_mode_enabled,
          holiday_message: data.holiday_message,
          disable_ordering: data.disable_ordering,
        });
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettingsFn({
        data: {
          customer_service_number: settings.customer_service_number,
          support_channel_link: settings.support_channel_link,
          holiday_mode_enabled: settings.holiday_mode_enabled,
          holiday_message: settings.holiday_message,
          disable_ordering: settings.disable_ordering,
        },
      });
      toast.success("Settings saved!");
    } catch (err) {
      toast.error("Failed to save settings");
    }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-up max-w-2xl">
      <h2 className="text-2xl font-heading font-bold text-foreground">Settings</h2>
      <GlassCard variant="strong">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Contact & Support</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Support Phone Number</label>
            <Input value={settings.customer_service_number} onChange={(e) => setSettings({ ...settings, customer_service_number: e.target.value })} className="h-11 bg-glass border-glass-border rounded-xl" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Support Channel Link</label>
            <Input value={settings.support_channel_link} onChange={(e) => setSettings({ ...settings, support_channel_link: e.target.value })} placeholder="https://whatsapp.com/channel/..." className="h-11 bg-glass border-glass-border rounded-xl" />
          </div>
        </div>
      </GlassCard>
      <GlassCard variant="strong">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Ordering Controls</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.disable_ordering} onChange={(e) => setSettings({ ...settings, disable_ordering: e.target.checked })} className="rounded" />
            <span className="text-sm text-foreground">Disable all ordering</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={settings.holiday_mode_enabled} onChange={(e) => setSettings({ ...settings, holiday_mode_enabled: e.target.checked })} className="rounded" />
            <span className="text-sm text-foreground">Holiday mode</span>
          </label>
          {settings.holiday_mode_enabled && (
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Holiday Message</label>
              <Input value={settings.holiday_message} onChange={(e) => setSettings({ ...settings, holiday_message: e.target.value })} className="h-11 bg-glass border-glass-border rounded-xl" />
            </div>
          )}
        </div>
      </GlassCard>
      <Button variant="gold" onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
      </Button>
    </div>
  );
}

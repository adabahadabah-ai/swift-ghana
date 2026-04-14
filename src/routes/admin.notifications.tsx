import { useState, useEffect } from "react";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Send, Bell, Loader2 } from "lucide-react";
import { apiPost } from "@/lib/api";

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<"all" | "agents" | "users">("all");
  const [sending, setSending] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchNotifications = async () => {
    const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20);
    if (data) setNotifications(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
    const channel = supabase
      .channel("admin-notifications-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => fetchNotifications())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) {
      toast.error("Please fill in title and message");
      return;
    }
    setSending(true);
    try {
      await apiPost("/api/admin/send-notification", { title: title.trim(), message: message.trim(), target_type: target });
      toast.success(`Notification sent to ${target}!`);
      setTitle("");
      setMessage("");
      fetchNotifications();
    } catch (err) {
      toast.error("Failed to send notification");
    }
    setSending(false);
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <h2 className="text-2xl font-heading font-bold text-foreground">Notifications</h2>
      <GlassCard variant="strong">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Send Pop-up Notification</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Target Audience</label>
            <div className="flex gap-2">
              {(["all", "agents", "users"] as const).map((t) => (
                <Button key={t} variant={target === t ? "gold" : "outline"} size="sm" onClick={() => setTarget(t)}>
                  {t === "all" ? "Everyone" : t === "agents" ? "Agents Only" : "Users Only"}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Title</label>
            <Input placeholder="Notification title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 bg-glass border-glass-border rounded-xl" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Message</label>
            <textarea placeholder="Type your message here..." rows={4} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-xl bg-glass border border-glass-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring backdrop-blur-md resize-none" />
          </div>
          <Button variant="gold" onClick={handleSend} disabled={sending}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Send className="h-4 w-4" /> Send Notification</>}
          </Button>
        </div>
      </GlassCard>
      <GlassCard variant="strong">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Sent Notifications</h3>
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No notifications sent yet</p>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="flex items-start gap-3 py-3 border-b border-glass-border/50 last:border-0">
                <div className="p-2 rounded-lg bg-gold-muted shrink-0"><Bell className="h-4 w-4 text-primary" /></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">Target: {n.target_type}</p>
                </div>
                <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}

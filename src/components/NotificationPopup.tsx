import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { X, Bell, Sparkles } from "lucide-react";

export function NotificationPopup() {
  const { user, isAuthenticated, hasRole } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const fetchNotifications = async () => {
      const { data: notifs } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (!notifs) return;

      const { data: dismissals } = await supabase
        .from("notification_dismissals")
        .select("notification_id")
        .eq("user_id", user.id);

      const dismissedIds = new Set((dismissals || []).map((d: any) => d.notification_id));
      setDismissed(dismissedIds);

      const userRole = hasRole("agent") ? "agents" : "users";
      const filtered = notifs.filter((n: any) => {
        if (dismissedIds.has(n.id)) return false;
        if (n.target_type === "all") return true;
        if (n.target_type === userRole) return true;
        if (n.target_user_id === user.id) return true;
        return false;
      });

      setNotifications(filtered);
    };

    fetchNotifications();
  }, [isAuthenticated, user, hasRole]);

  const handleDismiss = async (notifId: string) => {
    if (!user) return;
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));
    await supabase.from("notification_dismissals").insert({
      notification_id: notifId,
      user_id: user.id,
    });
  };

  if (notifications.length === 0) return null;

  const notif = notifications[0];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-md" onClick={() => handleDismiss(notif.id)} />
      <div className="relative w-full max-w-md animate-slide-up">
        <GlassCard variant="strong" className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gold-muted border border-primary/10">
                <Bell className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-base font-heading font-bold text-foreground tracking-tight">{notif.title}</h3>
            </div>
            <button onClick={() => handleDismiss(notif.id)} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-5">{notif.message}</p>
          <Button variant="gold" className="w-full" onClick={() => handleDismiss(notif.id)}>
            Got it
          </Button>
        </GlassCard>
      </div>
    </div>
  );
}

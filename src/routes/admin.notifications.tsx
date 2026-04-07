import { createFileRoute } from "@tanstack/react-router";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Send, Mail, MessageSquare, Smartphone } from "lucide-react";

export const Route = createFileRoute("/admin/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <h2 className="text-2xl font-heading font-bold text-foreground">Notifications</h2>

      <GlassCard variant="strong">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Send Broadcast</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Title</label>
            <Input placeholder="Notification title" className="h-11 bg-glass border-glass-border rounded-xl" />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1.5 block">Message</label>
            <textarea
              placeholder="Type your message here..."
              rows={4}
              className="w-full rounded-xl bg-glass border border-glass-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring backdrop-blur-md resize-none"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="gold" onClick={() => toast.success("Push notification sent!")}>
              <Send className="h-4 w-4" /> Push Notification
            </Button>
            <Button variant="outline" onClick={() => toast.success("Email sent!")}>
              <Mail className="h-4 w-4" /> Email
            </Button>
            <Button variant="outline" onClick={() => toast.success("SMS sent!")}>
              <Smartphone className="h-4 w-4" /> SMS
            </Button>
          </div>
        </div>
      </GlassCard>

      <GlassCard variant="strong">
        <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Recent Broadcasts</h3>
        <div className="space-y-3">
          {[
            { title: "New prices available!", msg: "Check out our updated data bundle prices", date: "Apr 7", type: "push" },
            { title: "Welcome bonus!", msg: "New agents get 50% off their first purchase", date: "Apr 5", type: "email" },
            { title: "Maintenance notice", msg: "System maintenance on Sunday 2am-4am", date: "Apr 3", type: "sms" },
          ].map((n, i) => (
            <div key={i} className="flex items-start gap-3 py-3 border-b border-glass-border/50 last:border-0">
              <div className="p-2 rounded-lg bg-gold-muted shrink-0">
                {n.type === "push" ? <MessageSquare className="h-4 w-4 text-primary" /> : n.type === "email" ? <Mail className="h-4 w-4 text-primary" /> : <Smartphone className="h-4 w-4 text-primary" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.msg}</p>
              </div>
              <span className="text-xs text-muted-foreground">{n.date}</span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}

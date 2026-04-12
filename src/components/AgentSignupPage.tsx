import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar, Footer } from "@/components/LandingPage";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, DollarSign, Globe, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function AgentSignupPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const refCode = searchParams?.get("ref") || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(form.email, form.password, {
        full_name: form.name,
        phone: form.phone,
      });
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (!signInError && data.user) {
        await supabase.from("user_roles").insert({ user_id: data.user.id, role: "agent" as never });
        await supabase.from("profiles").update({ full_name: form.name, phone: form.phone } as never).eq("id", data.user.id);
      }
      toast.success("Agent account created! Welcome to SwiftData.");
      navigate({ to: "/agent" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signup failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: DollarSign, title: "Discounted Prices", desc: "Get up to 20% off regular data bundle prices" },
    { icon: Globe, title: "Personal Store", desc: "Get your own branded store to sell data bundles" },
    { icon: Users, title: "Referral Earnings", desc: "Recruit sub-agents and earn commission on their sales" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-6xl mx-auto relative">
        <div className="absolute inset-0 bg-dot-grid opacity-10" />
        <div className="relative grid lg:grid-cols-2 gap-12 items-start">
          <div className="pt-8">
            <span className="section-label">Join the Network</span>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mt-3 mb-4 tracking-tight">
              Start <span className="gold-text">Earning</span> as an Agent
            </h1>
            <p className="text-muted-foreground text-sm mb-10 leading-relaxed">Join thousands of agents earning daily by reselling mobile data bundles across Ghana.</p>
            {refCode && (
              <div className="chip mb-6">
                <Sparkles className="h-3 w-3" />
                You were referred by an agent! You'll be added as their sub-agent.
              </div>
            )}
            <div className="space-y-3">
              {benefits.map((b, i) => (
                <div key={i} className={`flex items-start gap-3 p-4 rounded-xl group hover-lift ${i === 0 ? "card-yellow" : i === 1 ? "card-dark" : "glass-card"}`}>
                  <div className={`p-2 rounded-lg shrink-0 transition-colors ${
                    i === 0 ? "bg-[oklch(0.15_0.02_260_/_10%)]" : i === 1 ? "bg-[oklch(0.75_0.18_85_/_10%)] border border-[oklch(0.75_0.18_85_/_20%)]" : "bg-gold-muted border border-primary/10 group-hover:border-primary/30"
                  }`}>
                    <b.icon className={`h-4 w-4 ${i === 0 ? "text-[oklch(0.15_0.02_260)]" : i === 1 ? "text-[oklch(0.75_0.18_85)]" : "text-primary"}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-heading font-semibold tracking-tight">{b.title}</h3>
                    <p className="text-xs mt-0.5 opacity-70">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <GlassCard variant="strong" className="p-8">
            <h2 className="text-lg font-heading font-bold text-foreground mb-6 tracking-tight">Create Agent Account</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Full Name</label>
                <Input placeholder="Kwame Asante" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-10 bg-input border-border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Phone Number</label>
                <Input placeholder="024 XXX XXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-10 bg-input border-border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Email</label>
                <Input type="email" placeholder="kwame@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-10 bg-input border-border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Password</label>
                <Input type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-10 bg-input border-border rounded-lg text-sm" required />
              </div>
              <Button variant="hero" size="lg" className="w-full mt-2" type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Start Earning <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground text-center mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign In
              </Link>
            </p>
          </GlassCard>
        </div>
      </div>
      <Footer />
    </div>
  );
}

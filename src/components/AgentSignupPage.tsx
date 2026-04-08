import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Navbar, Footer } from "@/components/LandingPage";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, DollarSign, Globe, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AgentSignupPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(form.email, form.password, {
        full_name: form.name,
        phone: form.phone,
      });
      // After signup, add agent role via a separate call
      // The trigger creates profile + 'user' role. We need to also add 'agent' role.
      // We'll sign in and add the role
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });
      if (!signInError && data.user) {
        // Insert agent role - will work because user is now authenticated
        await supabase.from("user_roles").insert({ user_id: data.user.id, role: "agent" as never });
        // Update profile phone
        await supabase.from("profiles").update({ phone: form.phone } as never).eq("id", data.user.id);
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
    { icon: Globe, title: "Personal Mini Website", desc: "Get your own branded store to sell data bundles" },
    { icon: Users, title: "Earn from Referrals", desc: "Recruit sub-agents and earn commission on their sales" },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="pt-8">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
              Start <span className="gold-text">Earning</span> as an Agent
            </h1>
            <p className="text-muted-foreground mb-10">Join thousands of agents earning daily by reselling mobile data bundles across Ghana.</p>
            <div className="space-y-6">
              {benefits.map((b, i) => (
                <GlassCard key={i} className="flex items-start gap-4 p-4">
                  <div className="p-2.5 rounded-xl bg-gold-muted shrink-0">
                    <b.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground">{b.title}</h3>
                    <p className="text-sm text-muted-foreground">{b.desc}</p>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          <GlassCard variant="strong" className="p-8">
            <h2 className="text-xl font-heading font-bold text-foreground mb-6">Create Agent Account</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Full Name</label>
                <Input placeholder="Kwame Asante" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 bg-glass border-glass-border rounded-xl" required />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Phone Number</label>
                <Input placeholder="024 XXX XXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11 bg-glass border-glass-border rounded-xl" required />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
                <Input type="email" placeholder="kwame@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11 bg-glass border-glass-border rounded-xl" required />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Password</label>
                <Input type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="h-11 bg-glass border-glass-border rounded-xl" required />
              </div>
              <Button variant="hero" size="lg" className="w-full mt-2" type="submit" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Start Earning as an Agent <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </form>
            <p className="text-sm text-muted-foreground text-center mt-6">
              Already have an account?{" "}
              <a href="/login" className="text-primary hover:underline font-medium">Sign In</a>
            </p>
          </GlassCard>
        </div>
      </div>
      <Footer />
    </div>
  );
}

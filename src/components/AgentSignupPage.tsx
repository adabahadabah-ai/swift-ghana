import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { apiPost } from "@/lib/api";
import { Navbar, Footer } from "@/components/LandingPage";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, DollarSign, Globe, ArrowRight, Loader2, Sparkles, CreditCard } from "lucide-react";
import { toast } from "sonner";

const REGISTRATION_FEE_GHS = 80;
const REGISTRATION_FEE_PESOWAS = REGISTRATION_FEE_GHS * 100;

export default function AgentSignupPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const { signUp, signIn, refreshRoles, hasRole, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const refCode = searchParams?.get("ref") || null;

  useEffect(() => {
    if (isAuthenticated && hasRole("agent")) {
      navigate("/agent", { replace: true });
    }
  }, [isAuthenticated, hasRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(form.email, form.password, {
        full_name: form.name,
        phone: form.phone,
      });
      await signIn(form.email, form.password);
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) throw new Error("Could not sign in after signup");

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: form.name, phone: form.phone })
        .eq("id", u.id);
      if (profileError) throw new Error(profileError.message);

      await refreshRoles();
      toast.success("Account created. Complete GH₵80 registration to unlock your agent dashboard.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Signup failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const startRegistrationPayment = () => {
    if (!user?.id) {
      toast.error("Please sign in first");
      return;
    }
    const handler = (window as unknown as { PaystackPop?: { setup: (opts: object) => { openIframe: () => void } } }).PaystackPop?.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder",
      amount: REGISTRATION_FEE_PESOWAS,
      currency: "GHS",
      email: user.email || form.email || "agent@swiftdata.gh",
      metadata: {
        user_id: user.id,
        purpose: "agent_registration",
      },
      callback: async (response: { reference: string }) => {
        setPaying(true);
        try {
          await apiPost("/api/agent/verify-registration-fee", { reference: response.reference });
          await refreshRoles();
          toast.success("Welcome, agent! Your dashboard is ready.");
          navigate("/agent");
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : "Verification failed";
          toast.error(message);
        } finally {
          setPaying(false);
        }
      },
      onClose: () => toast.info("Payment window closed"),
    });
    if (handler) handler.openIframe();
    else toast.error("Paystack failed to load. Refresh the page.");
  };

  const showPaymentStep = isAuthenticated && user && !hasRole("agent");

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
            <p className="text-muted-foreground text-sm mb-10 leading-relaxed">
              One-time registration: <span className="text-primary font-semibold">GH₵{REGISTRATION_FEE_GHS}</span>. Then set up your mini-store, prices, and share your link.
            </p>
            {refCode && (
              <div className="chip mb-6">
                <Sparkles className="h-3 w-3" />
                You were referred by an agent! You&apos;ll be added as their sub-agent.
              </div>
            )}
            <div className="space-y-3">
              {[
                { icon: DollarSign, title: "Discounted Prices", desc: "Buy at agent cost and set your own retail prices" },
                { icon: Globe, title: "Your Mini-Store", desc: "Shareable store link with your branding and support details" },
                { icon: Users, title: "Grow", desc: "Refer sub-agents and earn on their activity" },
              ].map((b, i) => (
                <div key={b.title} className={`flex items-start gap-3 p-4 rounded-xl group hover-lift ${i === 0 ? "card-yellow" : i === 1 ? "card-dark" : "glass-card"}`}>
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
            {showPaymentStep ? (
              <>
                <h2 className="text-lg font-heading font-bold text-foreground mb-2 tracking-tight">Pay registration fee</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Pay <span className="text-primary font-bold">GH₵{REGISTRATION_FEE_GHS}</span> to activate your agent account. You&apos;ll get instant access to your dashboard and store builder.
                </p>
                <Button variant="hero" size="lg" className="w-full gap-2" type="button" onClick={startRegistrationPayment} disabled={paying}>
                  {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  Pay GH₵{REGISTRATION_FEE_GHS} with Paystack
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-6">
                  Wrong account?{" "}
                  <button type="button" className="text-primary underline" onClick={() => supabase.auth.signOut().then(() => navigate("/login"))}>
                    Sign out
                  </button>
                </p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-heading font-bold text-foreground mb-6 tracking-tight">Create account</h2>
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
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Continue <ArrowRight className="h-4 w-4" /></>}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground text-center mt-6">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">
                    Sign In
                  </Link>
                </p>
              </>
            )}
          </GlassCard>
        </div>
      </div>
      <Footer />
    </div>
  );
}

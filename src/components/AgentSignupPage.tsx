import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { apiPost } from "@/lib/api";
import { Navbar, Footer } from "@/components/LandingPage";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Users, DollarSign, Globe, ArrowRight, Loader2, Sparkles, CreditCard, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const REGISTRATION_FEE_GHS = 80;
const REGISTRATION_FEE_PESOWAS = REGISTRATION_FEE_GHS * 100;

export default function AgentSignupPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [paying, setPaying] = useState(false);
  const { refreshRoles, hasRole, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const refCode = searchParams?.get("ref") || null;

  // If already an agent, go straight to the dashboard
  useEffect(() => {
    if (isAuthenticated && hasRole("agent")) {
      navigate("/agent", { replace: true });
    }
  }, [isAuthenticated, hasRole, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Use supabase.auth.signUp directly so we can check if the user was auto-signed-in.
      // When Supabase email confirmation is disabled (recommended for this flow), signUp
      // returns a session immediately and we can proceed straight to the payment step.
      const { data, error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.name, phone: form.phone } },
      });

      if (error) {
        if (error.message.toLowerCase().includes("already registered") || error.message.toLowerCase().includes("already been registered")) {
          throw new Error("An account with this email already exists. Sign in to continue.");
        }
        throw error;
      }

      if (!data.session) {
        // Email confirmation is enabled in Supabase — user must confirm before paying.
        toast.info("Account created! Check your email to confirm it, then sign in and return here to pay.");
        setTimeout(() => navigate("/login"), 3500);
        return;
      }

      // Auto-signed-in: update the phone field (trigger already set full_name from metadata)
      await supabase
        .from("profiles")
        .update({ phone: form.phone })
        .eq("id", data.user!.id);

      // Sync the auth context with the new session so showPaymentStep becomes true
      await refreshRoles();
      toast.success("Account ready! Pay GH₵80 to activate your agent dashboard.");
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
    const PaystackPop = (window as unknown as { PaystackPop?: { setup: (opts: object) => { openIframe: () => void } } }).PaystackPop;
    if (!PaystackPop) {
      toast.error("Payment is still loading — please wait a moment and try again.");
      return;
    }
    const handler = PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder",
      amount: REGISTRATION_FEE_PESOWAS,
      currency: "GHS",
      email: user.email || form.email,
      metadata: { user_id: user.id, purpose: "agent_registration" },
      callback: async (response: { reference: string }) => {
        setPaying(true);
        try {
          await apiPost("/api/agent/verify-registration-fee", { reference: response.reference });
          // refreshRoles updates the auth context with the new "agent" role.
          // The useEffect above watches hasRole("agent") and navigates to /agent
          // once the state is committed — no direct navigate() needed here.
          await refreshRoles();
          toast.success("Welcome, agent! Redirecting to your dashboard…");
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : "Verification failed";
          toast.error(message);
          setPaying(false);
        }
      },
      onClose: () => toast.info("Payment window closed"),
    });
    handler.openIframe();
  };

  // showPaymentStep: signed-in user who hasn't paid yet
  const showPaymentStep = isAuthenticated && !!user && !hasRole("agent");
  // step for the visual indicator
  const currentStep = showPaymentStep ? 2 : 1;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 px-4 max-w-6xl mx-auto relative">
        <div className="absolute inset-0 bg-dot-grid opacity-10" />
        <div className="relative grid lg:grid-cols-2 gap-12 items-start">

          {/* Left — benefits */}
          <div className="pt-8">
            <span className="section-label">Join the Network</span>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mt-3 mb-4 tracking-tight">
              Start <span className="gold-text">Earning</span> as an Agent
            </h1>
            <p className="text-muted-foreground text-sm mb-10 leading-relaxed">
              One-time activation: <span className="text-primary font-semibold">GH₵{REGISTRATION_FEE_GHS}</span>. Get your store link, buy data at agent prices, and earn from referrals.
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
                { icon: Users, title: "Grow Your Network", desc: "Refer sub-agents and earn on their activity" },
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

          {/* Right — form card */}
          <GlassCard variant="strong" className="p-8">

            {/* Step indicator */}
            <div className="flex items-center gap-3 mb-8">
              {[
                { n: 1, label: "Create Account" },
                { n: 2, label: "Pay & Activate" },
              ].map(({ n, label }, i) => {
                const done = currentStep > n;
                const active = currentStep === n;
                return (
                  <div key={n} className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={cn(
                      "flex items-center gap-1.5 shrink-0",
                      done ? "text-primary" : active ? "text-foreground" : "text-muted-foreground"
                    )}>
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border flex-shrink-0",
                        done ? "bg-primary border-primary text-primary-foreground" :
                        active ? "border-primary text-primary bg-primary/10" :
                        "border-border text-muted-foreground"
                      )}>
                        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
                      </div>
                      <span className={cn("text-xs font-medium hidden sm:inline", active && "text-foreground font-semibold")}>{label}</span>
                    </div>
                    {i < 1 && <div className={cn("flex-1 h-px", currentStep > 1 ? "bg-primary/50" : "bg-border")} />}
                  </div>
                );
              })}
            </div>

            {showPaymentStep ? (
              /* ── Step 2: Pay & Activate ── */
              <div>
                <h2 className="text-lg font-heading font-bold text-foreground mb-1 tracking-tight">Activate your agent account</h2>
                <p className="text-sm text-muted-foreground mb-5">
                  Pay a <span className="text-primary font-bold">one-time fee of GH₵{REGISTRATION_FEE_GHS}</span> to unlock full access.
                </p>
                <div className="space-y-2.5 mb-6">
                  {[
                    "Instant access to your agent dashboard",
                    "Personal mini-store with shareable link",
                    "Buy data bundles at discounted agent prices",
                    "Earn commissions from sub-agent referrals",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full gap-2"
                  type="button"
                  onClick={startRegistrationPayment}
                  disabled={paying}
                >
                  {paying ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Verifying payment…</>
                  ) : (
                    <><CreditCard className="h-4 w-4" /> Pay GH₵{REGISTRATION_FEE_GHS} to Activate</>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-4">
                  Wrong account?{" "}
                  <button
                    type="button"
                    className="text-primary underline"
                    onClick={() => supabase.auth.signOut().then(() => navigate("/agent-signup"))}
                  >
                    Sign out
                  </button>
                </p>
              </div>
            ) : (
              /* ── Step 1: Create Account ── */
              <div>
                <h2 className="text-lg font-heading font-bold text-foreground mb-6 tracking-tight">Create your account</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Full Name</label>
                    <Input
                      placeholder="Kwame Asante"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="h-10 bg-input border-border rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Phone Number</label>
                    <Input
                      placeholder="024 XXX XXXX"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="h-10 bg-input border-border rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Email</label>
                    <Input
                      type="email"
                      placeholder="kwame@example.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="h-10 bg-input border-border rounded-lg text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Password</label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="h-10 bg-input border-border rounded-lg text-sm"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button variant="hero" size="lg" className="w-full mt-2" type="submit" disabled={loading}>
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>Continue to Payment <ArrowRight className="h-4 w-4" /></>
                    )}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground text-center mt-6">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium">Sign In</Link>
                </p>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
      <Footer />
    </div>
  );
}

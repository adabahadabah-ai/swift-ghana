import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, Shield, Users, ArrowRight, DollarSign, Globe, ExternalLink, Activity, Sparkles, TrendingUp, LogOut } from "lucide-react"; // Shield used for Admin nav link
import { GlassCard } from "@/components/GlassCard";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Network } from "@/lib/mock-data";

function Navbar() {
  const { isAuthenticated, hasRole, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Authenticated agents/admins go to their dashboard.
  // Authenticated users who haven't activated (no agent/admin role) go to the
  // agent-signup page which shows the Step 2 "Pay & Activate" screen.
  const getDashboardLink = () => {
    if (hasRole("admin")) return "/admin";
    if (hasRole("agent")) return "/agent";
    return "/agent-signup"; // signed in but not yet activated
  };

  // Whether the user is signed-in but hasn't activated their agent account
  const isPendingActivation = isAuthenticated && !hasRole("agent") && !hasRole("admin");

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/90 backdrop-blur-xl border-b border-border shadow-sm" : "bg-transparent"} rounded-none`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg gold-gradient-static flex items-center justify-center">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-lg tracking-tight text-foreground">Swift<span className="gold-text">Data</span></span>
        </Link>
        <div className="hidden md:flex items-center gap-8 text-sm">
          <Link to="/buy" className="text-muted-foreground hover:text-foreground transition-colors">Buy Data</Link>
          {!isAuthenticated && (
            <Link to="/agent-signup" className="text-muted-foreground hover:text-foreground transition-colors">Become Agent</Link>
          )}
          {hasRole("admin") && (
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors font-medium flex items-center gap-1">
              <Shield className="h-3.5 w-3.5" /> Admin
            </Link>
          )}
          {isAuthenticated && !hasRole("admin") && (
            <Link to={getDashboardLink()} className="text-muted-foreground hover:text-foreground transition-colors">
              {isPendingActivation ? "Activate Account" : "Dashboard"}
            </Link>
          )}
          {!isAuthenticated && (
            <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">Login</Link>
          )}
          {isAuthenticated && (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          )}
        </div>
        <Button variant="hero" size="sm" asChild>
          <Link to="/buy" className="gap-2">
            <Sparkles className="h-3.5 w-3.5" /> Buy Data
          </Link>
        </Button>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      <div className="absolute inset-0 bg-dot-grid opacity-30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-radial-glow opacity-40" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <div className="chip mx-auto mb-8">
            <Activity className="h-3 w-3" />
            Ghana's #1 Data Reselling Platform
          </div>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-heading font-bold text-gradient-muted leading-[1.1] mb-6 text-balance tracking-tight">
            Buy Affordable Data{" "}
            <span className="gold-text">Instantly</span>
          </h1>
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "0.35s", animationFillMode: "both" }}>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
            Fast, reliable & affordable. Get the best data bundle deals for MTN, AirtelTigo & Telecel — delivered in seconds.
          </p>
        </div>

        <div className="animate-fade-up flex flex-col sm:flex-row gap-3 justify-center" style={{ animationDelay: "0.5s", animationFillMode: "both" }}>
          <Button variant="hero" size="xl" asChild>
            <Link to="/buy">
              Buy Data Now <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="hero-outline" size="xl" asChild>
            <Link to="/agent-signup">Become an Agent</Link>
          </Button>
        </div>

        {/* Network cards */}
        <div className="animate-fade-up grid grid-cols-3 gap-3 sm:gap-4 max-w-sm mx-auto mt-20" style={{ animationDelay: "0.65s", animationFillMode: "both" }}>
          {(["MTN", "AirtelTigo", "Telecel"] as Network[]).map((n, i) => (
            <Link key={n} to="/buy">
              <GlassCard variant={i === 0 ? "yellow" : i === 1 ? "dark" : "default"} hover className="text-center py-4 px-3">
                <h3 className="text-sm font-heading font-bold tracking-tight">{n}</h3>
              </GlassCard>
            </Link>
          ))}
        </div>

        {/* Stats bar */}
        <div className="animate-fade-up mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto" style={{ animationDelay: "0.8s", animationFillMode: "both" }}>
          {[
            { label: "Active Agents", value: "2,000+" },
            { label: "Orders Delivered", value: "50K+" },
            { label: "Uptime", value: "99.9%" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-xl sm:text-2xl font-heading font-bold gold-text">{stat.value}</p>
              <p className="text-[11px] text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { num: "01", title: "Choose Network", desc: "Select MTN, AirtelTigo, or Telecel", icon: Globe },
    { num: "02", title: "Pick a Bundle", desc: "Choose your preferred data package", icon: Sparkles },
    { num: "03", title: "Pay & Receive", desc: "Pay instantly, data delivered in seconds", icon: Zap },
  ];

  return (
    <section className="py-28 relative">
      <div className="absolute inset-0 bg-dot-grid opacity-15" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="section-label">How it works</span>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mt-3 mb-4 tracking-tight">
            Three Simple <span className="gold-text">Steps</span>
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto text-sm">From selection to delivery in under 30 seconds</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          <div className="hidden md:block absolute top-1/2 left-[16%] right-[16%] h-px border-t border-dashed border-primary/20" />

          {steps.map((step, i) => (
            <GlassCard key={i} variant={i === 1 ? "yellow" : "strong"} hover className="text-center relative group">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full gold-gradient-static flex items-center justify-center text-[10px] font-bold text-primary-foreground z-10">
                {i + 1}
              </div>
              <div className="pt-4">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 transition-colors ${i === 1 ? "bg-[oklch(0.15_0.02_260_/_10%)]" : "bg-gold-muted border border-primary/10 group-hover:border-primary/30"}`}>
                  <step.icon className={`h-6 w-6 ${i === 1 ? "text-[oklch(0.15_0.02_260)]" : "text-primary"}`} />
                </div>
                <h3 className="text-base font-heading font-semibold mb-2 tracking-tight">{step.title}</h3>
                <p className="text-sm opacity-70">{step.desc}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  const benefits = [
    { icon: Zap, title: "Instant Delivery", desc: "Data bundles delivered to your phone within 30 seconds of payment. No waiting, no delays.", badge: "Fast" },
    { icon: Shield, title: "Cheapest Rates", desc: "We offer the most competitive data prices in Ghana. Save more every single month.", badge: "Best Price" },
    { icon: TrendingUp, title: "Agent Earnings", desc: "Become an agent, get discounted prices, and earn commission on every referral you make.", badge: "Earn" },
  ];

  return (
    <section className="py-28 relative">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="section-label">Why SwiftData</span>
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mt-3 mb-4 tracking-tight">
            Built for <span className="gold-text">Speed & Savings</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <GlassCard key={i} variant={i === 0 ? "dark" : i === 1 ? "yellow" : "strong"} hover className="group relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="chip m-3 text-[10px]">{b.badge}</div>
              </div>
              <div className={`w-11 h-11 rounded-lg flex items-center justify-center mb-5 transition-colors ${
                i === 0 ? "bg-[oklch(0.95_0_0_/_10%)]" : i === 1 ? "bg-[oklch(0.15_0.02_260_/_10%)]" : "bg-gold-muted border border-primary/10 group-hover:border-primary/30"
              }`}>
                <b.icon className={`h-5 w-5 ${i === 0 ? "text-[oklch(0.75_0.18_85)]" : i === 1 ? "text-[oklch(0.15_0.02_260)]" : "text-primary"}`} />
              </div>
              <h3 className="text-base font-heading font-semibold mb-2 tracking-tight">{b.title}</h3>
              <p className="text-sm opacity-70 leading-relaxed">{b.desc}</p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function BecomeAgent() {
  const agentBenefits = [
    { icon: DollarSign, title: "Discounted Prices", desc: "Get up to 20% off regular data bundle prices" },
    { icon: Globe, title: "Personal Store", desc: "Get your own branded store to sell data bundles" },
    { icon: Users, title: "Referral Earnings", desc: "Recruit sub-agents and earn commission on their sales" },
  ];

  return (
    <section className="py-28 relative">
      <div className="absolute inset-0 bg-dot-grid opacity-10" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card-dark p-8 sm:p-12 lg:p-16 relative overflow-hidden rounded-2xl">
          <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[100px]" style={{ background: "oklch(0.75 0.18 85 / 10%)" }} />

          <div className="relative grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[oklch(0.75_0.18_85)]">For Entrepreneurs</span>
              <h2 className="text-3xl sm:text-4xl font-heading font-bold text-[oklch(0.95_0_0)] mt-3 mb-4 tracking-tight">
                Become an <span className="gold-text">Agent</span>
              </h2>
              <p className="text-[oklch(0.65_0_0)] mb-8 leading-relaxed">
                Start your data reselling business today. Enjoy discounted prices, earn from every sale, and build your own brand.
              </p>
              <Button variant="hero" size="lg" asChild>
                <Link to="/agent-signup">
                  Start Earning <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="space-y-4">
              {agentBenefits.map((b, i) => (
                <div key={i} className="flex items-start gap-4 bg-[oklch(0.20_0.02_260)] p-4 rounded-xl border border-[oklch(0.30_0.01_260)] group hover-lift cursor-default">
                  <div className="p-2 rounded-lg bg-[oklch(0.75_0.18_85_/_10%)] border border-[oklch(0.75_0.18_85_/_20%)] shrink-0">
                    <b.icon className="h-4 w-4 text-[oklch(0.75_0.18_85)]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-heading font-semibold text-[oklch(0.95_0_0)] tracking-tight">{b.title}</h3>
                    <p className="text-xs text-[oklch(0.60_0_0)] mt-0.5">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const [settings, setSettings] = useState({
    support_channel_link: "https://whatsapp.com/channel/0029Vb6Xwed60eBaztkH2B3m",
    customer_service_number: "+233 560 042 269",
  });

  useEffect(() => {
    supabase.from("system_settings").select("support_channel_link, customer_service_number").eq("id", 1).single().then(({ data }) => {
      if (data) setSettings(data);
    });
  }, []);

  return (
    <footer className="border-t border-border py-12 bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg gold-gradient-static flex items-center justify-center">
                <Zap className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-heading font-bold text-foreground tracking-tight">Swift<span className="gold-text">Data</span></span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">Ghana's fastest data bundle reselling platform.</p>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">Quick Links</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link to="/buy" className="block hover:text-foreground transition-colors">Buy Data</Link>
              <Link to="/agent-signup" className="block hover:text-foreground transition-colors">Become Agent</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">Support</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>FAQs</p>
              <p>Contact Us</p>
              <p>Terms of Service</p>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-3 text-xs uppercase tracking-wider">Contact</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>support@swiftdata.gh</p>
              <p>{settings.customer_service_number}</p>
              <a
                href={settings.support_channel_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-foreground transition-colors"
              >
                Join our channel <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-border mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">© 2026 SwiftData Ghana. All rights reserved.</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            All systems operational
          </div>
        </div>
      </div>
    </footer>
  );
}

export { Navbar, Footer };

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <Benefits />
      <BecomeAgent />
      <Footer />
    </div>
  );
}

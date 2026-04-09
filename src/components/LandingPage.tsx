import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Zap, Shield, Users, ArrowRight, ChevronRight, DollarSign, Globe, ExternalLink } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Network } from "@/lib/mock-data";

function Navbar() {
  const { isAuthenticated, hasRole } = useAuth();

  const getDashboardLink = () => {
    if (hasRole("admin")) return "/admin";
    if (hasRole("agent")) return "/agent";
    return "/";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card-strong border-b border-glass-border rounded-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center font-bold text-primary-foreground text-sm">S</div>
          <span className="font-heading font-bold text-lg text-foreground">Swift<span className="gold-text">Data</span></span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/buy" className="hover:text-primary transition-colors">Buy Data</Link>
          {!isAuthenticated && (
            <Link to="/agent-signup" className="hover:text-primary transition-colors">Become Agent</Link>
          )}
          {isAuthenticated ? (
            <Link to={getDashboardLink()} className="hover:text-primary transition-colors">Dashboard</Link>
          ) : (
            <Link to="/login" className="hover:text-primary transition-colors">Login</Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="hero" size="sm" asChild>
            <Link to="/buy">Buy Data</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/8 blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-fade-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-xs font-medium text-primary mb-8">
            <Zap className="h-3.5 w-3.5" />
            Ghana's #1 Data Reselling Platform
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-heading font-bold text-foreground leading-tight mb-6 text-balance">
            Buy Affordable Data{" "}
            <span className="gold-text">Instantly</span> in Ghana
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Fast. Reliable. Affordable. Get the best data bundle deals for MTN, AirtelTigo & Telecel.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="xl" asChild>
              <Link to="/buy">
                Buy Data Now <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <Link to="/agent-signup">Become an Agent</Link>
            </Button>
          </div>
        </div>

        {/* Network names without icons */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-lg mx-auto mt-16">
          {(["MTN", "AirtelTigo", "Telecel"] as Network[]).map((n) => (
            <Link key={n} to="/buy">
              <GlassCard hover className="text-center hover-glow">
                <h3 className="text-lg font-heading font-bold text-foreground">{n}</h3>
              </GlassCard>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { num: "01", title: "Choose Network", desc: "Select MTN, AirtelTigo, or Telecel" },
    { num: "02", title: "Pick a Bundle", desc: "Choose your preferred data package" },
    { num: "03", title: "Enter Number & Pay", desc: "Type recipient's number and pay instantly" },
  ];

  return (
    <section className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            How It <span className="gold-text">Works</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Three simple steps to get your data bundle</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <GlassCard key={i} hover className="text-center relative">
              <div className="text-5xl font-heading font-bold gold-text opacity-30 mb-4">{step.num}</div>
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
              {i < 2 && (
                <ChevronRight className="hidden md:block absolute right-[-28px] top-1/2 -translate-y-1/2 h-6 w-6 text-primary/40" />
              )}
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function Benefits() {
  const benefits = [
    { icon: Zap, title: "Instant Delivery", desc: "Data bundles delivered to your phone within 30 seconds of payment." },
    { icon: Shield, title: "Cheapest Rates", desc: "We offer the most competitive data prices in Ghana. Save more every month." },
    { icon: Users, title: "Agent Earnings", desc: "Become an agent, get discounted prices, and earn commission on every referral." },
  ];

  return (
    <section className="py-24 relative">
      <div className="absolute inset-0 bg-primary/[3%]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            Why Choose <span className="gold-text">SwiftData</span>?
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {benefits.map((b, i) => (
            <GlassCard key={i} variant="strong" hover>
              <div className="w-12 h-12 rounded-xl bg-gold-muted flex items-center justify-center mb-4">
                <b.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
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
    { icon: Globe, title: "Personal Mini Website", desc: "Get your own branded store to sell data bundles" },
    { icon: Users, title: "Earn from Referrals", desc: "Recruit sub-agents and earn commission on their sales" },
  ];

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            Become an <span className="gold-text">Agent</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Start your data reselling business today. Enjoy discounted prices and earn from every sale.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {agentBenefits.map((b, i) => (
            <GlassCard key={i} hover className="text-center">
              <div className="w-12 h-12 rounded-xl bg-gold-muted flex items-center justify-center mx-auto mb-4">
                <b.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-heading font-semibold text-foreground mb-2">{b.title}</h3>
              <p className="text-sm text-muted-foreground">{b.desc}</p>
            </GlassCard>
          ))}
        </div>

        <div className="text-center">
          <Button variant="hero" size="xl" asChild>
            <Link to="/agent-signup">
              Start Earning as an Agent <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
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
    <footer className="border-t border-glass-border py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center font-bold text-primary-foreground text-sm">S</div>
              <span className="font-heading font-bold text-lg text-foreground">Swift<span className="gold-text">Data</span></span>
            </div>
            <p className="text-sm text-muted-foreground">Ghana's fastest data bundle reselling platform.</p>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-3 text-sm">Quick Links</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <Link to="/buy" className="block hover:text-primary transition-colors">Buy Data</Link>
              <Link to="/agent-signup" className="block hover:text-primary transition-colors">Become Agent</Link>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-3 text-sm">Support</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>FAQs</p>
              <p>Contact Us</p>
              <p>Terms of Service</p>
            </div>
          </div>
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-3 text-sm">Contact</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>support@swiftdata.gh</p>
              <p>{settings.customer_service_number}</p>
              <a
                href={settings.support_channel_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 hover:text-primary transition-colors"
              >
                Join our channel <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-glass-border mt-8 pt-8 text-center text-xs text-muted-foreground">
          © 2026 SwiftData Ghana. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

export { Navbar, Footer };

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <HowItWorks />
      <Benefits />
      <BecomeAgent />
      <Footer />
    </div>
  );
}

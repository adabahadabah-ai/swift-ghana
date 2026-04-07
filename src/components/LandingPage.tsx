import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Zap, Shield, Users, ArrowRight, Star, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { NetworkCard } from "@/components/NetworkCard";
import { testimonials } from "@/lib/mock-data";
import type { Network } from "@/lib/mock-data";

function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card-strong border-b border-glass-border rounded-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center font-bold text-primary-foreground text-sm">S</div>
          <span className="font-heading font-bold text-lg text-foreground">Swift<span className="gold-text">Data</span></span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/buy" className="hover:text-primary transition-colors">Buy Data</Link>
          <Link to="/agent-signup" className="hover:text-primary transition-colors">Become Agent</Link>
          <Link to="/agent" className="hover:text-primary transition-colors">Agent Login</Link>
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
      {/* Background effects */}
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

        {/* Network cards */}
        <div className="grid grid-cols-3 gap-4 sm:gap-6 max-w-lg mx-auto mt-16" style={{ animationDelay: "0.3s" }}>
          {(["MTN", "AirtelTigo", "Telecel"] as Network[]).map((n) => (
            <Link key={n} to="/buy">
              <NetworkCard network={n} className="hover-glow" />
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
    { num: "02", title: "Enter Number", desc: "Type the recipient's phone number" },
    { num: "03", title: "Get Data Instantly", desc: "Pay and receive data in seconds" },
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

function Testimonials() {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-4">
            Loved by <span className="gold-text">Thousands</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <GlassCard key={i} hover>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center text-xs font-bold text-primary-foreground">{t.avatar}</div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
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
              <p>+233 24 000 0000</p>
              <p>Accra, Ghana</p>
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
      <Testimonials />
      <Footer />
    </div>
  );
}

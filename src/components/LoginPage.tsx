import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Navbar, Footer } from "@/components/LandingPage";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const roles = await signIn(email, password);
      toast.success("Welcome back!");
      if (roles.includes("admin")) {
        navigate({ to: "/admin" });
      } else if (roles.includes("agent")) {
        navigate({ to: "/agent" });
      } else {
        navigate({ to: "/" });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16 px-4 flex items-center justify-center min-h-[80vh] relative">
        <div className="absolute inset-0 bg-dot-grid opacity-20" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-radial-glow opacity-50" />

        <GlassCard variant="strong" className="relative p-8 w-full max-w-md">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 rounded-lg gold-gradient-static flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-foreground tracking-tight">Welcome back</h1>
              <p className="text-xs text-muted-foreground">Sign in to your SwiftData account</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 bg-glass border-glass-border rounded-lg text-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block uppercase tracking-wider">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 bg-glass border-glass-border rounded-lg text-sm"
                required
              />
            </div>
            <Button variant="hero" size="lg" className="w-full mt-2" type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-6">
            Don't have an account?{" "}
            <Link to="/agent-signup" className="text-primary hover:underline font-medium">
              Become an Agent
            </Link>
          </p>
        </GlassCard>
      </div>
      <Footer />
    </div>
  );
}

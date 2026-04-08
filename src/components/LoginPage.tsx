import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { Navbar, Footer } from "@/components/LandingPage";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2 } from "lucide-react";
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
      <div className="pt-24 pb-16 px-4 flex items-center justify-center min-h-[80vh]">
        <GlassCard variant="strong" className="p-8 w-full max-w-md">
          <h1 className="text-2xl font-heading font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-muted-foreground mb-6">Sign in to your SwiftData account</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 bg-glass border-glass-border rounded-xl"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 bg-glass border-glass-border rounded-xl"
                required
              />
            </div>
            <Button variant="hero" size="lg" className="w-full mt-2" type="submit" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </form>
          <p className="text-sm text-muted-foreground text-center mt-6">
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

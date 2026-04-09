import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, ShoppingCart, FileText, Users, UserPlus,
  DollarSign, Globe, Settings, Menu, X, LogOut, Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { NotificationPopup } from "@/components/NotificationPopup";

const agentNav = [
  { label: "Overview", to: "/agent", icon: LayoutDashboard },
  { label: "Buy Data", to: "/agent/buy", icon: ShoppingCart },
  { label: "Wallet", to: "/agent/wallet", icon: Wallet },
  { label: "My Orders", to: "/agent/orders", icon: FileText },
  { label: "Customers", to: "/agent/customers", icon: Users },
  { label: "Sub-Agents", to: "/agent/sub-agents", icon: UserPlus },
  { label: "Earnings", to: "/agent/earnings", icon: DollarSign },
  { label: "My Store", to: "/agent/store", icon: Globe },
  { label: "Settings", to: "/agent/settings", icon: Settings },
];

export default function AgentDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { signOut, loading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (!isAuthenticated || !hasRole("agent")) {
    navigate({ to: "/login" });
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen flex">
      <NotificationPopup />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/80 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 glass-card-strong border-r border-glass-border flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-5 flex items-center justify-between border-b border-glass-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center font-bold text-primary-foreground text-sm">S</div>
            <span className="font-heading font-bold text-foreground">Swift<span className="gold-text">Data</span></span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {agentNav.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== "/agent" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-gold-muted text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-glass-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-14 glass-card-strong border-b border-glass-border rounded-none flex items-center px-4 gap-4">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-heading font-semibold text-foreground">Agent Dashboard</h1>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

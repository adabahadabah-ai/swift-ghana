import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, FileText, Users, UserPlus,
  DollarSign, Globe, Settings, Menu, X, LogOut, Wallet, ArrowDownToLine, Zap
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
  { label: "Sub-Agents", to: "/agent/manage-sub-agents", icon: UserPlus },
  { label: "Earnings", to: "/agent/earnings", icon: DollarSign },
  { label: "Withdrawals", to: "/agent/withdrawals", icon: ArrowDownToLine },
  { label: "My Store", to: "/agent/store", icon: Globe },
  { label: "Settings", to: "/agent/settings", icon: Settings },
];

export default function AgentDashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { signOut, loading, isAuthenticated, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!hasRole("agent") && !hasRole("admin")) {
      navigate("/agent-signup");
    }
  }, [loading, isAuthenticated, hasRole, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (!hasRole("agent") && !hasRole("admin"))) {
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex bg-background">
      <NotificationPopup />

      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-60 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gold-gradient-static flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-sidebar-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-sm text-sidebar-foreground tracking-tight">Swift<span className="text-sidebar-primary">Data</span></span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-sidebar-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {agentNav.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== "/agent" && location.pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary border-l-2 border-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-sidebar-border">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors w-full"
          >
            <LogOut className="h-3.5 w-3.5" />
            Log Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-12 bg-background/80 backdrop-blur-xl border-b border-border flex items-center px-4 gap-3">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-muted-foreground">
            <Menu className="h-4 w-4" />
          </button>
          <h1 className="text-xs font-heading font-semibold text-muted-foreground uppercase tracking-wider">Agent Dashboard</h1>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

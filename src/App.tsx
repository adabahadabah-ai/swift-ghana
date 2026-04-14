import { Routes, Route, Link } from "react-router-dom";
import LandingPage from "@/components/LandingPage";
import LoginPage from "@/components/LoginPage";
import AgentSignupPage from "@/components/AgentSignupPage";
import BuyDataFlow from "@/components/BuyDataFlow";
import AgentOverview from "@/components/AgentOverview";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";
import AgentDashboardLayout from "@/components/AgentDashboardLayout";
import AdminOverview from "@/routes/admin.index";
import AdminPricesPage from "@/routes/admin.prices";
import AdminOrdersPage from "@/routes/admin.orders";
import AdminUsersPage from "@/routes/admin.users";
import AdminAgentsPage from "@/routes/admin.agents";
import AdminWithdrawalsPage from "@/routes/admin.withdrawals";
import AdminNotificationsPage from "@/routes/admin.notifications";
import AdminSettingsPage from "@/routes/admin.settings";
import AgentBuyPage from "@/routes/agent.buy";
import WalletPage from "@/components/WalletPage";
import AgentOrdersPage from "@/routes/agent.orders";
import AgentCustomersPage from "@/routes/agent.customers";
import AgentManageSubAgentsPage from "@/routes/agent.manage-sub-agents";
import EarningsPage from "@/components/EarningsPage";
import AgentWithdrawalsPage from "@/routes/agent.withdrawals";
import AgentStorePage from "@/components/AgentStorePage";
import AgentSettingsPage from "@/routes/agent.settings";
import SubAgentsPage from "@/components/SubAgentsPage";
import StoreAgentPage from "@/routes/store.$agentId";

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or has been moved.</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/buy" element={<BuyDataFlow />} />
      <Route path="/agent-signup" element={<AgentSignupPage />} />
      <Route path="/store/:agentId" element={<StoreAgentPage />} />

      <Route path="/admin" element={<AdminDashboardLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="prices" element={<AdminPricesPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="agents" element={<AdminAgentsPage />} />
        <Route path="withdrawals" element={<AdminWithdrawalsPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      <Route path="/agent" element={<AgentDashboardLayout />}>
        <Route index element={<AgentOverview />} />
        <Route path="buy" element={<AgentBuyPage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="orders" element={<AgentOrdersPage />} />
        <Route path="customers" element={<AgentCustomersPage />} />
        <Route path="manage-sub-agents" element={<AgentManageSubAgentsPage />} />
        <Route path="sub-agents" element={<SubAgentsPage />} />
        <Route path="earnings" element={<EarningsPage />} />
        <Route path="withdrawals" element={<AgentWithdrawalsPage />} />
        <Route path="store" element={<AgentStorePage />} />
        <Route path="settings" element={<AgentSettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

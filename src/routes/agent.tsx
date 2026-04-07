import { createFileRoute } from "@tanstack/react-router";
import AgentDashboardLayout from "@/components/AgentDashboardLayout";

export const Route = createFileRoute("/agent")({
  component: AgentDashboardLayout,
});

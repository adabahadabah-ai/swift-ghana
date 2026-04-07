import { createFileRoute } from "@tanstack/react-router";
import SubAgentsPage from "@/components/SubAgentsPage";

export const Route = createFileRoute("/agent/sub-agents")({
  component: SubAgentsPage,
});

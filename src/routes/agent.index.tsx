import { createFileRoute } from "@tanstack/react-router";
import AgentOverview from "@/components/AgentOverview";

export const Route = createFileRoute("/agent/")({
  component: AgentOverview,
});

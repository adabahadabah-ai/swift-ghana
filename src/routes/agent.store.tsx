import { createFileRoute } from "@tanstack/react-router";
import AgentStorePage from "@/components/AgentStorePage";

export const Route = createFileRoute("/agent/store")({
  component: AgentStorePage,
});

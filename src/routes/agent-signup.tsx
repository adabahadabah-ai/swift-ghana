import { createFileRoute } from "@tanstack/react-router";
import AgentSignupPage from "@/components/AgentSignupPage";

export const Route = createFileRoute("/agent-signup")({
  component: AgentSignupPage,
});

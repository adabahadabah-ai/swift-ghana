import { createFileRoute } from "@tanstack/react-router";
import BuyDataFlow from "@/components/BuyDataFlow";

export const Route = createFileRoute("/store/$agentId")({
  component: AgentMiniStore,
});

function AgentMiniStore() {
  const { agentId } = Route.useParams();
  const agentName = agentId.charAt(0).toUpperCase() + agentId.slice(1).replace(/-/g, " ");

  return (
    <div className="min-h-screen">
      <div className="text-center pt-8 pb-4 px-4">
        <div className="w-16 h-16 rounded-full gold-gradient mx-auto flex items-center justify-center text-2xl font-bold text-primary-foreground mb-3">
          {agentName.charAt(0)}
        </div>
      </div>
      <BuyDataFlow storeName={agentName} />
      <div className="text-center pb-8 text-xs text-muted-foreground">
        Powered by <span className="text-primary font-medium">SwiftData Ghana</span>
      </div>
    </div>
  );
}

import { useParams } from "react-router-dom";
import BuyDataFlow from "@/components/BuyDataFlow";

export default function StoreAgentPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const id = agentId ?? "";
  const agentName = id ? id.charAt(0).toUpperCase() + id.slice(1).replace(/-/g, " ") : "Agent";

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

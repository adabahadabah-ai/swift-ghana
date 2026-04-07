import { createFileRoute } from "@tanstack/react-router";
import BuyDataFlow from "@/components/BuyDataFlow";

export const Route = createFileRoute("/agent/buy")({
  component: () => <BuyDataFlow isAgent />,
});

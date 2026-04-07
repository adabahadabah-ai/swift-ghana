import { createFileRoute } from "@tanstack/react-router";
import EarningsPage from "@/components/EarningsPage";

export const Route = createFileRoute("/agent/earnings")({
  component: EarningsPage,
});

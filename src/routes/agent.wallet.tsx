import { createFileRoute } from "@tanstack/react-router";
import WalletPage from "@/components/WalletPage";

export const Route = createFileRoute("/agent/wallet")({
  component: WalletPage,
});

import { createFileRoute } from "@tanstack/react-router";
import AdminDashboardLayout from "@/components/AdminDashboardLayout";

export const Route = createFileRoute("/admin")({
  component: AdminDashboardLayout,
});

/**
 * Express app — shared between local dev server (server/index.ts)
 * and Vercel serverless functions (api/[...slug].ts).
 *
 * Does NOT call app.listen() or serve static files — those are
 * handled by server/index.ts (local) and Vercel (production) respectively.
 */
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";
import * as adminOps from "../src/server/admin-ops";
import * as agentOps from "../src/server/agent-ops";
import * as orderOps from "../src/server/order-ops";
import { supabaseAdmin } from "../src/integrations/supabase/client.server";

export const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));

async function getUserIdFromAuthHeader(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user.id;
}

function asyncHandler(
  fn: (req: express.Request, res: express.Response, userId: string) => Promise<unknown>
) {
  return async (req: express.Request, res: express.Response) => {
    try {
      const userId = await getUserIdFromAuthHeader(req.headers.authorization);
      if (!userId) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const result = await fn(req, res, userId);
      res.json(result);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Server error";
      const status =
        message === "Unauthorized: admin only" ||
        message === "Forbidden: agent only" ||
        message === "Forbidden: agent_id must match authenticated user"
          ? 403
          : message === "Unauthorized"
            ? 401
            : 400;
      res.status(status).json({ error: message });
    }
  };
}

// ── Auth ────────────────────────────────────────────────────────────────────

// Returns the authenticated user's roles using the service-role key (bypasses
// RLS entirely — no recursion, no policy issues).
app.post("/api/auth/get-roles", async (req, res) => {
  const userId = await getUserIdFromAuthHeader(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) {
    res.status(400).json({ error: error.message });
    return;
  }
  res.json({ roles: (data ?? []).map((r) => r.role) });
});

// ── Admin ───────────────────────────────────────────────────────────────────

app.post("/api/admin/list-users", asyncHandler(async (_req, _res, userId) => adminOps.listDirectoryUsersOp(userId)));

app.post("/api/admin/set-user-admin-role", asyncHandler(async (req, _res, userId) => adminOps.setUserAdminRoleOp(userId, req.body)));

app.post("/api/admin/update-package-price", asyncHandler(async (req, _res, userId) => adminOps.updatePackagePriceOp(userId, req.body)));

app.post("/api/admin/send-notification", asyncHandler(async (req, _res, userId) => adminOps.sendNotificationOp(userId, req.body)));

app.post("/api/admin/update-system-settings", asyncHandler(async (req, _res, userId) => adminOps.updateSystemSettingsOp(userId, req.body)));

app.post("/api/admin/confirm-withdrawal", asyncHandler(async (req, _res, userId) => adminOps.confirmWithdrawalOp(userId, req.body)));

app.post("/api/admin/approve-agent", asyncHandler(async (req, _res, userId) => adminOps.approveAgentOp(userId, req.body)));

app.post("/api/admin/create-package", asyncHandler(async (req, _res, userId) => adminOps.createPackageOp(userId, req.body)));

app.post("/api/admin/delete-package", asyncHandler(async (req, _res, userId) => adminOps.deletePackageOp(userId, req.body)));

app.post("/api/admin/list-orders", asyncHandler(async (_req, _res, userId) => adminOps.listOrdersOp(userId)));

// ── Agent ────────────────────────────────────────────────────────────────────

app.post("/api/agent/update-store", asyncHandler(async (req, _res, userId) => agentOps.updateAgentStoreOp(userId, req.body)));

app.post("/api/agent/request-withdrawal", asyncHandler(async (req, _res, userId) => agentOps.requestWithdrawalOp(userId, req.body)));

app.post("/api/agent/verify-top-up", asyncHandler(async (req, _res, userId) => agentOps.verifyTopUpOp(userId, req.body)));

app.post("/api/agent/verify-registration-fee", asyncHandler(async (req, _res, userId) => agentOps.verifyAgentRegistrationFeeOp(userId, req.body)));

app.post("/api/agent/list-orders", asyncHandler(async (_req, _res, userId) => agentOps.listAgentOrdersOp(userId)));

// ── Orders ───────────────────────────────────────────────────────────────────

app.post("/api/order/process-data-order-public", async (req, res) => {
  try {
    const result = await orderOps.processDataOrderPublicOp(req.body);
    res.json(result);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    res.status(400).json({ error: message });
  }
});

app.post("/api/order/process-wallet-purchase", asyncHandler(async (req, _res, userId) => orderOps.processWalletPurchaseOp(userId, req.body)));

app.post("/api/order/create-agent-store", asyncHandler(async (req, _res, userId) => orderOps.createAgentStoreOp(userId, req.body)));

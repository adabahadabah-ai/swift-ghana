import { supabaseAdmin } from "../integrations/supabase/client.server";
import { z } from "zod";
import type { DirectoryUserRow } from "../types/directory-user";

export type { DirectoryUserRow };

export async function requireAdminUser(userId: string) {
  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleData) throw new Error("Unauthorized: admin only");
}

export async function listDirectoryUsersOp(actorUserId: string) {
  await requireAdminUser(actorUserId);

  const { data: profiles, error: pErr } = await supabaseAdmin
    .from("profiles")
    .select("id, full_name, email, phone")
    .order("created_at", { ascending: false });
  if (pErr) throw new Error(pErr.message);

  const { data: allRoles, error: rErr } = await supabaseAdmin.from("user_roles").select("user_id, role");
  if (rErr) throw new Error(rErr.message);

  const rolesByUser = new Map<string, ("admin" | "agent" | "user")[]>();
  for (const row of allRoles ?? []) {
    const uid = row.user_id;
    const r = row.role as "admin" | "agent" | "user";
    const list = rolesByUser.get(uid) ?? [];
    list.push(r);
    rolesByUser.set(uid, list);
  }

  const rows: DirectoryUserRow[] = (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    phone: p.phone,
    roles: rolesByUser.get(p.id) ?? [],
  }));

  return { users: rows };
}

const setUserAdminRoleSchema = z.object({
  user_id: z.string().uuid(),
  is_admin: z.boolean(),
});

export async function setUserAdminRoleOp(actorUserId: string, body: unknown) {
  const data = setUserAdminRoleSchema.parse(body);
  await requireAdminUser(actorUserId);

  if (data.is_admin) {
    const { error } = await supabaseAdmin.from("user_roles").insert({
      user_id: data.user_id,
      role: "admin",
    });
    if (error && error.code !== "23505") throw new Error(error.message);
    return { success: true as const };
  }

  const { count, error: countErr } = await supabaseAdmin
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");
  if (countErr) throw new Error(countErr.message);
  if ((count ?? 0) <= 1) {
    throw new Error("Cannot remove the last admin account");
  }

  const { error } = await supabaseAdmin
    .from("user_roles")
    .delete()
    .eq("user_id", data.user_id)
    .eq("role", "admin");
  if (error) throw new Error(error.message);
  return { success: true as const };
}

const updatePackagePriceSchema = z.object({
  network: z.string().min(1).max(50),
  package_size: z.string().min(1).max(50),
  public_price: z.number().min(0),
  agent_price: z.number().min(0),
  is_unavailable: z.boolean(),
});

export async function updatePackagePriceOp(actorUserId: string, body: unknown) {
  const data = updatePackagePriceSchema.parse(body);
  await requireAdminUser(actorUserId);

  const { data: existing } = await supabaseAdmin
    .from("global_package_settings")
    .select("id")
    .eq("network", data.network)
    .eq("package_size", data.package_size)
    .single();

  if (existing) {
    await supabaseAdmin
      .from("global_package_settings")
      .update({
        public_price: data.public_price,
        agent_price: data.agent_price,
        is_unavailable: data.is_unavailable,
      })
      .eq("id", existing.id);
  } else {
    await supabaseAdmin.from("global_package_settings").insert({
      network: data.network,
      package_size: data.package_size,
      public_price: data.public_price,
      agent_price: data.agent_price,
      is_unavailable: data.is_unavailable,
    });
  }
  return { success: true };
}

const sendNotificationSchema = z.object({
  title: z.string().min(1).max(255),
  message: z.string().min(1).max(2000),
  target_type: z.enum(["all", "agents", "users"]),
});

export async function sendNotificationOp(actorUserId: string, body: unknown) {
  const data = sendNotificationSchema.parse(body);
  await requireAdminUser(actorUserId);

  await supabaseAdmin.from("notifications").insert({
    title: data.title,
    message: data.message,
    target_type: data.target_type,
    created_by: actorUserId,
  });
  return { success: true };
}

const updateSystemSettingsSchema = z.object({
  customer_service_number: z.string().max(50),
  support_channel_link: z.string().max(500),
  holiday_mode_enabled: z.boolean(),
  holiday_message: z.string().max(500),
  disable_ordering: z.boolean(),
});

export async function updateSystemSettingsOp(actorUserId: string, body: unknown) {
  const data = updateSystemSettingsSchema.parse(body);
  await requireAdminUser(actorUserId);

  await supabaseAdmin.from("system_settings").update(data).eq("id", 1);
  return { success: true };
}

const confirmWithdrawalSchema = z.object({
  withdrawal_id: z.string().uuid(),
});

export async function confirmWithdrawalOp(actorUserId: string, body: unknown) {
  const data = confirmWithdrawalSchema.parse(body);
  await requireAdminUser(actorUserId);

  const { data: withdrawal } = await supabaseAdmin
    .from("withdrawals")
    .select("*")
    .eq("id", data.withdrawal_id)
    .eq("status", "pending")
    .single();
  if (!withdrawal) throw new Error("Withdrawal not found or already processed");

  await supabaseAdmin
    .from("withdrawals")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", data.withdrawal_id);

  const { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("total_profit")
    .eq("agent_id", withdrawal.agent_id)
    .single();

  if (wallet) {
    await supabaseAdmin
      .from("wallets")
      .update({ total_profit: Math.max(0, Number(wallet.total_profit) - Number(withdrawal.amount)) })
      .eq("agent_id", withdrawal.agent_id);
  }

  await supabaseAdmin.from("wallet_transactions").insert({
    agent_id: withdrawal.agent_id,
    type: "withdrawal",
    amount: Number(withdrawal.amount),
    description: `Withdrawal confirmed - MoMo: ${withdrawal.momo_number}`,
  });

  return { success: true };
}

export type AdminOrderRow = {
  id: string;
  created_at: string;
  customer_phone: string | null;
  network: string | null;
  package_size: string | null;
  amount: number;
  status: string;
  agent_id: string | null;
  profit: number;
};

export async function listOrdersOp(actorUserId: string) {
  await requireAdminUser(actorUserId);
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("id, created_at, customer_phone, network, package_size, amount, status, agent_id, profit")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(error.message);
  return { orders: (orders ?? []) as AdminOrderRow[] };
}

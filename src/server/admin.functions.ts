import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

// Admin: Update package prices
export const updatePackagePrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      network: z.string().min(1).max(50),
      package_size: z.string().min(1).max(50),
      public_price: z.number().min(0),
      agent_price: z.number().min(0),
      is_unavailable: z.boolean(),
    }).parse
  )
  .handler(async ({ data, context }) => {
    // Verify admin role
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .single();
    if (!roleData) throw new Error("Unauthorized: admin only");

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
  });

// Admin: Send notification
export const sendNotification = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      title: z.string().min(1).max(255),
      message: z.string().min(1).max(2000),
      target_type: z.enum(["all", "agents", "users"]),
    }).parse
  )
  .handler(async ({ data, context }) => {
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .single();
    if (!roleData) throw new Error("Unauthorized: admin only");

    await supabaseAdmin.from("notifications").insert({
      title: data.title,
      message: data.message,
      target_type: data.target_type,
      created_by: context.userId,
    });
    return { success: true };
  });

// Admin: Update system settings
export const updateSystemSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      customer_service_number: z.string().max(50),
      support_channel_link: z.string().max(500),
      holiday_mode_enabled: z.boolean(),
      holiday_message: z.string().max(500),
      disable_ordering: z.boolean(),
    }).parse
  )
  .handler(async ({ data, context }) => {
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .single();
    if (!roleData) throw new Error("Unauthorized: admin only");

    await supabaseAdmin.from("system_settings").update(data).eq("id", 1);
    return { success: true };
  });

// Admin: Confirm withdrawal
export const confirmWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      withdrawal_id: z.string().uuid(),
    }).parse
  )
  .handler(async ({ data, context }) => {
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .single();
    if (!roleData) throw new Error("Unauthorized: admin only");

    // Get withdrawal details
    const { data: withdrawal } = await supabaseAdmin
      .from("withdrawals")
      .select("*")
      .eq("id", data.withdrawal_id)
      .eq("status", "pending")
      .single();
    if (!withdrawal) throw new Error("Withdrawal not found or already processed");

    // Update withdrawal status
    await supabaseAdmin
      .from("withdrawals")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", data.withdrawal_id);

    // Deduct from agent's total_profit
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

    // Record transaction
    await supabaseAdmin.from("wallet_transactions").insert({
      agent_id: withdrawal.agent_id,
      type: "withdrawal",
      amount: Number(withdrawal.amount),
      description: `Withdrawal confirmed - MoMo: ${withdrawal.momo_number}`,
    });

    return { success: true };
  });

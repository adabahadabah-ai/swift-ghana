import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

// Agent: Update store settings
export const updateAgentStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      store_name: z.string().min(1).max(100),
      store_description: z.string().max(500),
      support_phone: z.string().max(50),
      whatsapp_link: z.string().max(500),
      is_published: z.boolean(),
    }).parse
  )
  .handler(async ({ data, context }) => {
    await supabaseAdmin
      .from("agent_stores")
      .update(data)
      .eq("agent_id", context.userId);
    return { success: true };
  });

// Agent: Request withdrawal
export const requestWithdrawal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      amount: z.number().min(20).max(100000),
      momo_number: z.string().min(10).max(15),
      momo_network: z.enum(["MTN", "AirtelTigo", "Telecel"]),
      momo_name: z.string().min(1).max(100),
    }).parse
  )
  .handler(async ({ data, context }) => {
    // Verify agent has enough profit
    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("total_profit")
      .eq("agent_id", context.userId)
      .single();

    if (!wallet || Number(wallet.total_profit) < data.amount) {
      throw new Error("Insufficient confirmed profit for withdrawal");
    }

    // Check for pending withdrawals
    const { data: pending } = await supabaseAdmin
      .from("withdrawals")
      .select("id")
      .eq("agent_id", context.userId)
      .eq("status", "pending");

    if (pending && pending.length > 0) {
      throw new Error("You already have a pending withdrawal request");
    }

    // Create withdrawal
    const { error } = await supabaseAdmin.from("withdrawals").insert({
      agent_id: context.userId,
      amount: data.amount,
      momo_number: data.momo_number,
      momo_network: data.momo_network,
      momo_name: data.momo_name,
      status: "pending",
    });

    if (error) throw new Error("Failed to create withdrawal request");

    return { success: true };
  });

// Wallet top-up verification via Paystack
export const verifyTopUp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      reference: z.string().min(1).max(255),
      amount: z.number().min(1),
    }).parse
  )
  .handler(async ({ data, context }) => {
    const paystackKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackKey) throw new Error("Paystack not configured");

    // Verify with Paystack
    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${data.reference}`, {
      headers: { Authorization: `Bearer ${paystackKey}` },
    });
    const result = await verifyRes.json();

    if (!result.status || result.data?.status !== "success") {
      throw new Error("Payment verification failed");
    }

    const amountGHS = result.data.amount / 100;

    // Check for duplicate
    const { data: existing } = await supabaseAdmin
      .from("wallet_transactions")
      .select("id")
      .eq("paystack_reference", data.reference)
      .single();

    if (existing) return { success: true, already_processed: true };

    // Credit wallet
    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("balance")
      .eq("agent_id", context.userId)
      .single();

    if (wallet) {
      await supabaseAdmin
        .from("wallets")
        .update({ balance: Number(wallet.balance) + amountGHS })
        .eq("agent_id", context.userId);
    } else {
      await supabaseAdmin.from("wallets").insert({
        agent_id: context.userId,
        balance: amountGHS,
      });
    }

    // Record transaction
    await supabaseAdmin.from("wallet_transactions").insert({
      agent_id: context.userId,
      type: "topup",
      amount: amountGHS,
      paystack_reference: data.reference,
      description: `Wallet top-up via Paystack`,
      reference: await supabaseAdmin.rpc("generate_topup_reference").then(r => r.data),
    });

    return { success: true, balance: (wallet ? Number(wallet.balance) : 0) + amountGHS };
  });

import { supabaseAdmin } from "../integrations/supabase/client.server";
import { z } from "zod";

const updateAgentStoreSchema = z.object({
  store_name: z.string().min(1).max(100),
  store_description: z.string().max(500),
  support_phone: z.string().max(50),
  whatsapp_link: z.string().max(500),
  is_published: z.boolean(),
});

export async function updateAgentStoreOp(userId: string, body: unknown) {
  const data = updateAgentStoreSchema.parse(body);
  await supabaseAdmin.from("agent_stores").update(data).eq("agent_id", userId);
  return { success: true };
}

const requestWithdrawalSchema = z.object({
  amount: z.number().min(20).max(100000),
  momo_number: z.string().min(10).max(15),
  momo_network: z.enum(["MTN", "AirtelTigo", "Telecel"]),
  momo_name: z.string().min(1).max(100),
});

export async function requestWithdrawalOp(userId: string, body: unknown) {
  const data = requestWithdrawalSchema.parse(body);

  const { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("total_profit")
    .eq("agent_id", userId)
    .single();

  if (!wallet || Number(wallet.total_profit) < data.amount) {
    throw new Error("Insufficient confirmed profit for withdrawal");
  }

  const { data: pending } = await supabaseAdmin
    .from("withdrawals")
    .select("id")
    .eq("agent_id", userId)
    .eq("status", "pending");

  if (pending && pending.length > 0) {
    throw new Error("You already have a pending withdrawal request");
  }

  const { error } = await supabaseAdmin.from("withdrawals").insert({
    agent_id: userId,
    amount: data.amount,
    momo_number: data.momo_number,
    momo_network: data.momo_network,
    momo_name: data.momo_name,
    status: "pending",
  });

  if (error) throw new Error("Failed to create withdrawal request");

  return { success: true };
}

const verifyTopUpSchema = z.object({
  reference: z.string().min(1).max(255),
  amount: z.number().min(1),
});

export async function verifyTopUpOp(userId: string, body: unknown) {
  const data = verifyTopUpSchema.parse(body);
  const paystackKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackKey) throw new Error("Paystack not configured");

  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${data.reference}`, {
    headers: { Authorization: `Bearer ${paystackKey}` },
  });
  const result = await verifyRes.json();

  if (!result.status || result.data?.status !== "success") {
    throw new Error("Payment verification failed");
  }

  const amountGHS = result.data.amount / 100;

  const { data: existing } = await supabaseAdmin
    .from("wallet_transactions")
    .select("id")
    .eq("paystack_reference", data.reference)
    .single();

  if (existing) return { success: true, already_processed: true };

  const { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("balance")
    .eq("agent_id", userId)
    .single();

  if (wallet) {
    await supabaseAdmin
      .from("wallets")
      .update({ balance: Number(wallet.balance) + amountGHS })
      .eq("agent_id", userId);
  } else {
    await supabaseAdmin.from("wallets").insert({
      agent_id: userId,
      balance: amountGHS,
    });
  }

  const refRes = await supabaseAdmin.rpc("generate_topup_reference");
  await supabaseAdmin.from("wallet_transactions").insert({
    agent_id: userId,
    type: "topup",
    amount: amountGHS,
    paystack_reference: data.reference,
    description: `Wallet top-up via Paystack`,
    reference: refRes.data,
  });

  return { success: true, balance: (wallet ? Number(wallet.balance) : 0) + amountGHS };
}

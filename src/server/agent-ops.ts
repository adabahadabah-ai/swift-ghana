import { supabaseAdmin } from "../integrations/supabase/client.server";
import { z } from "zod";
import { verifyPaystackTransaction } from "./paystack-verify";

const AGENT_REGISTRATION_FEE_GHS = 80;

async function requireAgentUser(userId: string) {
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "agent")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: agent only");
}

export type AgentOrderRow = {
  id: string;
  created_at: string;
  customer_phone: string | null;
  network: string | null;
  package_size: string | null;
  amount: number;
  status: string;
  profit: number;
};

/** Orders placed on this agent's mini-store (agent_id = authenticated user). */
export async function listAgentOrdersOp(userId: string) {
  await requireAgentUser(userId);
  const { data: orders, error } = await supabaseAdmin
    .from("orders")
    .select("id, created_at, customer_phone, network, package_size, amount, status, profit")
    .eq("agent_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return { orders: (orders ?? []) as AgentOrderRow[] };
}

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

const verifyRegistrationSchema = z.object({
  reference: z.string().min(1).max(255),
});

/**
 * After Paystack GH₵80 payment: grant agent role, store, wallet, and record payment.
 * Paystack metadata must include `user_id` matching the authenticated user.
 */
export async function verifyAgentRegistrationFeeOp(userId: string, body: unknown) {
  const { reference } = verifyRegistrationSchema.parse(body);
  const v = await verifyPaystackTransaction(reference);

  const rawUid = v.metadata.user_id;
  const metaUid = rawUid == null ? "" : String(rawUid);
  if (metaUid !== userId) {
    throw new Error("Payment does not match this account");
  }

  if (v.amountGHS < AGENT_REGISTRATION_FEE_GHS - 0.05) {
    throw new Error(`Registration fee must be GH₵${AGENT_REGISTRATION_FEE_GHS}`);
  }

  const { data: alreadyAgent } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "agent")
    .maybeSingle();
  if (alreadyAgent) {
    return { success: true as const, already_agent: true as const };
  }

  const { data: dupTx } = await supabaseAdmin
    .from("wallet_transactions")
    .select("id")
    .eq("paystack_reference", reference)
    .maybeSingle();
  if (dupTx) {
    return { success: true as const, already_processed: true as const };
  }

  const { error: roleErr } = await supabaseAdmin.from("user_roles").insert({
    user_id: userId,
    role: "agent",
  });
  if (roleErr && roleErr.code !== "23505") throw new Error(roleErr.message);

  const { data: existingStore } = await supabaseAdmin
    .from("agent_stores")
    .select("id")
    .eq("agent_id", userId)
    .maybeSingle();
  if (!existingStore) {
    await supabaseAdmin.from("agent_stores").insert({
      agent_id: userId,
      store_name: "",
      store_description: "",
      support_phone: "",
      whatsapp_link: "",
      is_published: false,
    });
  }

  const { data: existingWallet } = await supabaseAdmin
    .from("wallets")
    .select("id")
    .eq("agent_id", userId)
    .maybeSingle();
  if (!existingWallet) {
    await supabaseAdmin.from("wallets").insert({ agent_id: userId, balance: 0 });
  }

  await supabaseAdmin.from("wallet_transactions").insert({
    agent_id: userId,
    type: "registration_fee",
    amount: v.amountGHS,
    paystack_reference: reference,
    description: "Agent registration fee",
  });

  return { success: true as const };
}

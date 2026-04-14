import { supabaseAdmin } from "../integrations/supabase/client.server";
import { z } from "zod";
import { verifyPaystackTransaction } from "./paystack-verify";

const DATA_API_URL = "https://nanafua.com/api/v1/order";

const processDataOrderPublicSchema = z.object({
  phone: z.string().min(10).max(15),
  size: z.number().min(1),
  network: z.string().min(1).max(50),
  amount_paid: z.number().min(0),
  agent_price: z.number().min(0),
  package_size: z.string().min(1).max(50),
  paystack_reference: z.string().min(1).max(255),
  /** Mini-store agent; omit for main-site (platform) orders */
  agent_id: z.string().uuid().optional(),
});

/**
 * Guest + logged-in checkout: verifies Paystack server-side, then fulfills data.
 * No Supabase session required (regular users buy without an account).
 */
export async function processDataOrderPublicOp(body: unknown) {
  const data = processDataOrderPublicSchema.parse(body);

  const verified = await verifyPaystackTransaction(data.paystack_reference);
  if (Math.abs(verified.amountGHS - data.amount_paid) > 0.05) {
    throw new Error("Paid amount does not match order total");
  }

  const { data: dup } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("paystack_reference", data.paystack_reference)
    .maybeSingle();
  if (dup) {
    return { success: true, order_id: dup.id, duplicate: true as const };
  }

  const apiKey = process.env.DATA_ORDER_API_KEY;
  if (!apiKey) throw new Error("Data order API key not configured");

  let cleanPhone = data.phone.replace(/\s/g, "").replace(/^\+233/, "0").replace(/^233/, "0");

  let apiNetwork = data.network;
  if (data.network === "AirtelTigo" || data.network === "AIRTELTIGO_ISHARE") {
    apiNetwork = "AIRTELTIGO_ISHARE";
  }

  const agentId = data.agent_id ?? null;
  const profit = agentId ? Math.max(0, data.amount_paid - data.agent_price) : 0;

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .insert({
      agent_id: agentId,
      amount: data.amount_paid,
      profit,
      order_type: "data",
      customer_phone: cleanPhone,
      network: data.network,
      package_size: data.package_size,
      status: "processing",
      paystack_reference: data.paystack_reference,
    })
    .select("id")
    .single();

  if (orderError) throw new Error("Failed to create order");

  try {
    const response = await fetch(DATA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        phone: cleanPhone,
        size: data.size,
        network: apiNetwork,
      }),
    });

    const result = await response.json();

    if (response.ok) {
      await supabaseAdmin.from("orders").update({ status: "completed" }).eq("id", order.id);

      if (profit > 0 && agentId) {
        const { data: wallet } = await supabaseAdmin
          .from("wallets")
          .select("total_profit")
          .eq("agent_id", agentId)
          .single();

        if (wallet) {
          await supabaseAdmin
            .from("wallets")
            .update({ total_profit: Number(wallet.total_profit) + profit })
            .eq("agent_id", agentId);
        }
      }

      return { success: true, order_id: order.id, api_response: result };
    } else {
      await supabaseAdmin
        .from("orders")
        .update({
          status: "failed",
          failure_reason: result.message || "API error",
        })
        .eq("id", order.id);
      return { success: false, error: result.message || "Data delivery failed", order_id: order.id };
    }
  } catch {
    await supabaseAdmin
      .from("orders")
      .update({
        status: "failed",
        failure_reason: "Network error connecting to data provider",
      })
      .eq("id", order.id);
    return { success: false, error: "Failed to connect to data provider", order_id: order.id };
  }
}

const processWalletPurchaseSchema = z.object({
  phone: z.string().min(10).max(15),
  size: z.number().min(1),
  network: z.string().min(1).max(50),
  amount: z.number().min(0),
  agent_price: z.number().min(0),
  package_size: z.string().min(1).max(50),
});

export async function processWalletPurchaseOp(userId: string, body: unknown) {
  const data = processWalletPurchaseSchema.parse(body);

  const { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("balance")
    .eq("agent_id", userId)
    .single();

  if (!wallet || Number(wallet.balance) < data.amount) {
    throw new Error("Insufficient wallet balance");
  }

  await supabaseAdmin
    .from("wallets")
    .update({ balance: Number(wallet.balance) - data.amount })
    .eq("agent_id", userId);

  await supabaseAdmin.from("wallet_transactions").insert({
    agent_id: userId,
    type: "deduction",
    amount: data.amount,
    description: `Data purchase: ${data.package_size} ${data.network}`,
  });

  let apiNetwork = data.network;
  if (data.network === "AirtelTigo") apiNetwork = "AIRTELTIGO_ISHARE";

  const apiKey = process.env.DATA_ORDER_API_KEY;
  if (!apiKey) throw new Error("Data order API key not configured");

  const cleanPhone = data.phone.replace(/\s/g, "").replace(/^\+233/, "0").replace(/^233/, "0");

  const profit = data.amount - data.agent_price;

  const { data: order } = await supabaseAdmin
    .from("orders")
    .insert({
      agent_id: userId,
      amount: data.amount,
      profit: Math.max(0, profit),
      order_type: "data",
      customer_phone: cleanPhone,
      network: data.network,
      package_size: data.package_size,
      status: "processing",
    })
    .select("id")
    .single();

  try {
    const response = await fetch(DATA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        phone: cleanPhone,
        size: data.size,
        network: apiNetwork,
      }),
    });

    const result = await response.json();

    if (response.ok && order) {
      await supabaseAdmin.from("orders").update({ status: "completed" }).eq("id", order.id);
      if (profit > 0) {
        const { data: w2 } = await supabaseAdmin.from("wallets").select("total_profit").eq("agent_id", userId).single();
        if (w2) {
          await supabaseAdmin.from("wallets").update({ total_profit: Number(w2.total_profit) + profit }).eq("agent_id", userId);
        }
      }
      return { success: true, order_id: order?.id };
    } else {
      if (order) {
        await supabaseAdmin.from("orders").update({ status: "failed", failure_reason: result.message || "API error" }).eq("id", order.id);
      }
      await supabaseAdmin.from("wallets").update({ balance: Number(wallet.balance) }).eq("agent_id", userId);
      return { success: false, error: result.message || "Data delivery failed" };
    }
  } catch {
    if (order) {
      await supabaseAdmin.from("orders").update({ status: "failed", failure_reason: "Network error" }).eq("id", order.id);
    }
    await supabaseAdmin.from("wallets").update({ balance: Number(wallet.balance) }).eq("agent_id", userId);
    return { success: false, error: "Failed to connect to data provider" };
  }
}

const createAgentStoreSchema = z.object({
  agent_id: z.string().uuid(),
});

export async function createAgentStoreOp(userId: string, body: unknown) {
  const data = createAgentStoreSchema.parse(body);
  if (data.agent_id !== userId) {
    throw new Error("Forbidden: agent_id must match authenticated user");
  }

  const { data: existing } = await supabaseAdmin
    .from("agent_stores")
    .select("id")
    .eq("agent_id", data.agent_id)
    .single();

  if (!existing) {
    await supabaseAdmin.from("agent_stores").insert({
      agent_id: data.agent_id,
      store_name: "",
      store_description: "",
    });
  }

  const { data: existingWallet } = await supabaseAdmin
    .from("wallets")
    .select("id")
    .eq("agent_id", data.agent_id)
    .single();

  if (!existingWallet) {
    await supabaseAdmin.from("wallets").insert({
      agent_id: data.agent_id,
      balance: 0,
    });
  }

  return { success: true };
}

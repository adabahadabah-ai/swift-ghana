import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { z } from "zod";

const DATA_API_URL = "https://nanafua.com/api/v1/order";

// Process a data order after successful payment
export const processDataOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      phone: z.string().min(10).max(15),
      size: z.number().min(1),
      network: z.string().min(1).max(50),
      amount_paid: z.number().min(0),
      agent_price: z.number().min(0),
      paystack_reference: z.string().max(255).optional(),
      package_size: z.string().min(1).max(50),
      agent_id: z.string().uuid().optional(),
    }).parse
  )
  .handler(async ({ data, context }) => {
    const apiKey = process.env.DATA_ORDER_API_KEY;
    if (!apiKey) throw new Error("Data order API key not configured");

    // Clean phone number - remove +233, 233 prefix, spaces
    let cleanPhone = data.phone.replace(/\s/g, "").replace(/^\+233/, "0").replace(/^233/, "0");

    // Map network names for the API
    let apiNetwork = data.network;
    if (data.network === "AirtelTigo" || data.network === "AIRTELTIGO_ISHARE") {
      apiNetwork = "AIRTELTIGO_ISHARE" as any;
    }

    // Calculate profit
    const profit = data.amount_paid - data.agent_price;

    // Create order record
    const { data: order, error: orderError } = await supabaseAdmin.from("orders").insert({
      agent_id: data.agent_id || context.userId,
      amount: data.amount_paid,
      profit: Math.max(0, profit),
      order_type: "data",
      customer_phone: cleanPhone,
      network: data.network,
      package_size: data.package_size,
      status: "processing",
    }).select("id").single();

    if (orderError) throw new Error("Failed to create order");

    // Call the data API
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

        // Update agent profit if applicable
        if (profit > 0) {
          const { data: wallet } = await supabaseAdmin
            .from("wallets")
            .select("total_profit")
            .eq("agent_id", data.agent_id || context.userId)
            .single();

          if (wallet) {
            await supabaseAdmin
              .from("wallets")
              .update({ total_profit: Number(wallet.total_profit) + profit })
              .eq("agent_id", data.agent_id || context.userId);
          }
        }

        return { success: true, order_id: order.id, api_response: result };
      } else {
        await supabaseAdmin.from("orders").update({
          status: "failed",
          failure_reason: result.message || "API error",
        }).eq("id", order.id);
        return { success: false, error: result.message || "Data delivery failed", order_id: order.id };
      }
    } catch (err) {
      await supabaseAdmin.from("orders").update({
        status: "failed",
        failure_reason: "Network error connecting to data provider",
      }).eq("id", order.id);
      return { success: false, error: "Failed to connect to data provider", order_id: order.id };
    }
  });

// Process wallet purchase (deduct from wallet + order data)
export const processWalletPurchase = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      phone: z.string().min(10).max(15),
      size: z.number().min(1),
      network: z.string().min(1).max(50),
      amount: z.number().min(0),
      agent_price: z.number().min(0),
      package_size: z.string().min(1).max(50),
    }).parse
  )
  .handler(async ({ data, context }) => {
    // Check wallet balance
    const { data: wallet } = await supabaseAdmin
      .from("wallets")
      .select("balance")
      .eq("agent_id", context.userId)
      .single();

    if (!wallet || Number(wallet.balance) < data.amount) {
      throw new Error("Insufficient wallet balance");
    }

    // Deduct from wallet
    await supabaseAdmin
      .from("wallets")
      .update({ balance: Number(wallet.balance) - data.amount })
      .eq("agent_id", context.userId);

    // Record wallet transaction
    await supabaseAdmin.from("wallet_transactions").insert({
      agent_id: context.userId,
      type: "deduction",
      amount: data.amount,
      description: `Data purchase: ${data.package_size} ${data.network}`,
    });

    // Map network for API
    let apiNetwork = data.network;
    if (data.network === "AirtelTigo") apiNetwork = "AIRTELTIGO_ISHARE";

    // Now process the data order
    const apiKey = process.env.DATA_ORDER_API_KEY;
    if (!apiKey) throw new Error("Data order API key not configured");

    let cleanPhone = data.phone.replace(/\s/g, "").replace(/^\+233/, "0").replace(/^233/, "0");

    const profit = data.amount - data.agent_price;

    const { data: order } = await supabaseAdmin.from("orders").insert({
      agent_id: context.userId,
      amount: data.amount,
      profit: Math.max(0, profit),
      order_type: "data",
      customer_phone: cleanPhone,
      network: data.network,
      package_size: data.package_size,
      status: "processing",
    }).select("id").single();

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
          const { data: w2 } = await supabaseAdmin.from("wallets").select("total_profit").eq("agent_id", context.userId).single();
          if (w2) {
            await supabaseAdmin.from("wallets").update({ total_profit: Number(w2.total_profit) + profit }).eq("agent_id", context.userId);
          }
        }
        return { success: true, order_id: order?.id };
      } else {
        if (order) {
          await supabaseAdmin.from("orders").update({ status: "failed", failure_reason: result.message || "API error" }).eq("id", order.id);
        }
        // Refund wallet
        await supabaseAdmin.from("wallets").update({ balance: Number(wallet.balance) }).eq("agent_id", context.userId);
        return { success: false, error: result.message || "Data delivery failed" };
      }
    } catch (err) {
      if (order) {
        await supabaseAdmin.from("orders").update({ status: "failed", failure_reason: "Network error" }).eq("id", order.id);
      }
      await supabaseAdmin.from("wallets").update({ balance: Number(wallet.balance) }).eq("agent_id", context.userId);
      return { success: false, error: "Failed to connect to data provider" };
    }
  });

// Create agent store on signup
export const createAgentStore = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      agent_id: z.string().uuid(),
    }).parse
  )
  .handler(async ({ data }) => {
    // Check if store already exists
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

    // Create wallet if not exists
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
  });

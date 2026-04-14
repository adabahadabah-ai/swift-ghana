/** Shared Paystack transaction verification (server-only). */

export type PaystackVerifyResult = {
  amountGHS: number;
  reference: string;
  metadata: Record<string, unknown>;
};

export async function verifyPaystackTransaction(reference: string): Promise<PaystackVerifyResult> {
  const key = process.env.PAYSTACK_SECRET_KEY;
  if (!key) throw new Error("Paystack not configured");

  const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const json = (await verifyRes.json()) as {
    status?: boolean;
    data?: { status?: string; amount?: number; reference?: string; metadata?: Record<string, unknown> };
  };

  if (!json.status || json.data?.status !== "success") {
    throw new Error("Payment verification failed");
  }

  const amount = json.data?.amount ?? 0;
  return {
    amountGHS: amount / 100,
    reference: json.data?.reference ?? reference,
    metadata: json.data?.metadata ?? {},
  };
}

import { supabase } from "@/integrations/supabase/client";

export async function apiPost<T>(path: string, body: unknown = {}): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  const res = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(text || res.statusText);
  }
  if (!res.ok) {
    const err = (json as { error?: string })?.error ?? res.statusText;
    throw new Error(typeof err === "string" ? err : res.statusText);
  }
  return json as T;
}

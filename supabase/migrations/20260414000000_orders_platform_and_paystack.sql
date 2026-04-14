-- Allow platform (main site) orders without tying to an agent user
ALTER TABLE public.orders ALTER COLUMN agent_id DROP NOT NULL;

-- Dedupe Paystack payments for data orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paystack_reference text;

CREATE UNIQUE INDEX IF NOT EXISTS orders_paystack_reference_unique
  ON public.orders (paystack_reference)
  WHERE paystack_reference IS NOT NULL;

-- Prevent clients from self-granting agent role without server-side payment flow
DROP POLICY IF EXISTS "Users can add agent role to self" ON public.user_roles;

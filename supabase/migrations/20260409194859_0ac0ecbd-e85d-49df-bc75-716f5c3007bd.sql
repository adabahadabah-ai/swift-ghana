
-- Sub-agents table
CREATE TABLE public.sub_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_agent_id uuid NOT NULL,
  sub_agent_user_id uuid NOT NULL,
  referral_code text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sub_agent_user_id)
);

ALTER TABLE public.sub_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own sub-agents" ON public.sub_agents
  FOR SELECT USING (parent_agent_id = auth.uid());

CREATE POLICY "Sub-agents can view their own record" ON public.sub_agents
  FOR SELECT USING (sub_agent_user_id = auth.uid());

CREATE POLICY "Admins can view all sub-agents" ON public.sub_agents
  FOR SELECT USING (has_role('admin'::app_role));

CREATE POLICY "Only service_role can manage sub-agents" ON public.sub_agents
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_sub_agents_updated_at
  BEFORE UPDATE ON public.sub_agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Wallet transactions table
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'topup',
  amount numeric NOT NULL,
  reference text,
  paystack_reference text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own transactions" ON public.wallet_transactions
  FOR SELECT USING (agent_id = auth.uid());

CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions
  FOR SELECT USING (has_role('admin'::app_role));

CREATE POLICY "Only service_role can manage transactions" ON public.wallet_transactions
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Add agent role to the enum if not exists (agent role for sub-agent distinction)
-- We need the 'agent' role in the enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'agent' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
    ALTER TYPE public.app_role ADD VALUE 'agent';
  END IF;
END$$;

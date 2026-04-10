
-- Agent store settings
CREATE TABLE public.agent_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL UNIQUE,
  store_name text NOT NULL DEFAULT '',
  store_description text NOT NULL DEFAULT '',
  support_phone text NOT NULL DEFAULT '',
  whatsapp_link text NOT NULL DEFAULT '',
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_stores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own store" ON public.agent_stores FOR SELECT USING (agent_id = auth.uid());
CREATE POLICY "Agents can update their own store" ON public.agent_stores FOR UPDATE USING (agent_id = auth.uid());
CREATE POLICY "Anyone can view published stores" ON public.agent_stores FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can view all stores" ON public.agent_stores FOR SELECT USING (has_role('admin'::app_role));
CREATE POLICY "Only service_role can insert stores" ON public.agent_stores FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE TRIGGER update_agent_stores_updated_at BEFORE UPDATE ON public.agent_stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Agent store packages (agent's selling prices for their mini-store)
CREATE TABLE public.agent_store_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  network text NOT NULL,
  package_size text NOT NULL,
  selling_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agent_id, network, package_size)
);

ALTER TABLE public.agent_store_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own packages" ON public.agent_store_packages FOR SELECT USING (agent_id = auth.uid());
CREATE POLICY "Agents can insert their own packages" ON public.agent_store_packages FOR INSERT WITH CHECK (agent_id = auth.uid());
CREATE POLICY "Agents can update their own packages" ON public.agent_store_packages FOR UPDATE USING (agent_id = auth.uid());
CREATE POLICY "Agents can delete their own packages" ON public.agent_store_packages FOR DELETE USING (agent_id = auth.uid());
CREATE POLICY "Public can view packages of published stores" ON public.agent_store_packages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.agent_stores WHERE agent_stores.agent_id = agent_store_packages.agent_id AND agent_stores.is_published = true)
);
CREATE POLICY "Admins can view all packages" ON public.agent_store_packages FOR SELECT USING (has_role('admin'::app_role));

CREATE TRIGGER update_agent_store_packages_updated_at BEFORE UPDATE ON public.agent_store_packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sub-agent pricing (prices set by parent agent for their sub-agents)
CREATE TABLE public.sub_agent_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  network text NOT NULL,
  package_size text NOT NULL,
  sub_agent_price numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(agent_id, network, package_size)
);

ALTER TABLE public.sub_agent_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own sub-agent packages" ON public.sub_agent_packages FOR SELECT USING (agent_id = auth.uid());
CREATE POLICY "Agents can insert their own sub-agent packages" ON public.sub_agent_packages FOR INSERT WITH CHECK (agent_id = auth.uid());
CREATE POLICY "Agents can update their own sub-agent packages" ON public.sub_agent_packages FOR UPDATE USING (agent_id = auth.uid());
CREATE POLICY "Agents can delete their own sub-agent packages" ON public.sub_agent_packages FOR DELETE USING (agent_id = auth.uid());
CREATE POLICY "Sub-agents can view their parent's prices" ON public.sub_agent_packages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sub_agents WHERE sub_agents.parent_agent_id = sub_agent_packages.agent_id AND sub_agents.sub_agent_user_id = auth.uid())
);
CREATE POLICY "Admins can view all sub-agent packages" ON public.sub_agent_packages FOR SELECT USING (has_role('admin'::app_role));

CREATE TRIGGER update_sub_agent_packages_updated_at BEFORE UPDATE ON public.sub_agent_packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add momo details to withdrawals table
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS momo_number text NOT NULL DEFAULT '';
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS momo_network text NOT NULL DEFAULT '';
ALTER TABLE public.withdrawals ADD COLUMN IF NOT EXISTS momo_name text NOT NULL DEFAULT '';

-- Add total_profit to wallets
ALTER TABLE public.wallets ADD COLUMN IF NOT EXISTS total_profit numeric NOT NULL DEFAULT 0;

-- Withdrawal insert policy for agents
CREATE POLICY "Agents can request withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (agent_id = auth.uid());

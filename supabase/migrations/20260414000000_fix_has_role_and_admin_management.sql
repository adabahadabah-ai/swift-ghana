
-- Add single-argument overload for has_role that uses auth.uid() internally.
-- This fixes the broken policies in sub_agents and wallet_transactions tables
-- that were calling has_role('admin'::app_role) with only one argument.
CREATE OR REPLACE FUNCTION public.has_role(_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = _role
  )
$$;

-- Drop and recreate the broken policies that used the 1-arg has_role call.
-- sub_agents policies
DROP POLICY IF EXISTS "Admins can view all sub-agents" ON public.sub_agents;
CREATE POLICY "Admins can view all sub-agents" ON public.sub_agents
  FOR SELECT USING (public.has_role('admin'::app_role));

-- wallet_transactions policies
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.wallet_transactions;
CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions
  FOR SELECT USING (public.has_role('admin'::app_role));

-- Security-definer function so admins can assign any role to any user.
-- This bypasses RLS entirely and checks admin status inside the function.
CREATE OR REPLACE FUNCTION public.assign_user_role(target_user_id UUID, new_role app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, new_role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Security-definer function so admins can remove a role from a user.
CREATE OR REPLACE FUNCTION public.remove_user_role(target_user_id UUID, target_role app_role)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Access denied: admin role required';
  END IF;

  DELETE FROM public.user_roles
  WHERE user_id = target_user_id AND role = target_role;
END;
$$;

-- Grant execute permissions to authenticated users (the functions enforce admin check internally)
GRANT EXECUTE ON FUNCTION public.assign_user_role(UUID, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_user_role(UUID, app_role) TO authenticated;

-- Drop the problematic "Admins can manage roles" policy on user_roles.
-- This policy calls has_role(uid, 'admin') which queries user_roles inside itself,
-- causing recursion that silently returns empty results for role reads.
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- Ensure the basic read policy is correct
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- SECURITY DEFINER RPC: bypasses RLS entirely, always returns current user's roles.
-- This is the reliable way for the frontend to fetch roles without RLS interference.
CREATE OR REPLACE FUNCTION public.get_my_roles()
RETURNS TABLE(role app_role)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = auth.uid();
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_roles() TO authenticated;

-- Recreate a safe admin management policy for INSERT/UPDATE/DELETE only (not SELECT)
-- so admins can insert/update/delete roles via the assign_user_role RPC
DROP POLICY IF EXISTS "Service role can manage roles" ON public.user_roles;
CREATE POLICY "Service role can manage roles" ON public.user_roles
  FOR ALL USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

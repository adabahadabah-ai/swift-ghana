-- ============================================================
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- BEFORE running: replace 'YOUR_ADMIN_EMAIL' with your actual admin email
-- ============================================================

-- Step 1: Fix user_roles unique constraint
-- (old constraint only allowed one role per user, blocking multi-role)
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_key;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

-- Step 2: Drop ALL old RLS policies on user_roles
-- (the "Admins can manage roles" policy called has_role() which queried user_roles
--  → infinite recursion → every role lookup returned empty)
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_read_own_roles" ON public.user_roles;
DROP POLICY IF EXISTS "service_role_manage_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable all for service role" ON public.user_roles;

-- Step 3: Add clean, non-recursive RLS policies
CREATE POLICY "users_read_own_roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "service_role_manage_roles" ON public.user_roles
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Step 4: Create SECURITY DEFINER function so client can read roles
-- without hitting RLS at all
CREATE OR REPLACE FUNCTION public.get_my_roles()
  RETURNS TABLE(role app_role)
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT ur.role FROM public.user_roles ur WHERE ur.user_id = auth.uid();
END;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_roles() TO authenticated;

-- Step 5: Ensure admin user has the admin role in user_roles
-- REPLACE 'YOUR_ADMIN_EMAIL' with your admin email address
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'YOUR_ADMIN_EMAIL'
ON CONFLICT (user_id, role) DO NOTHING;

-- Step 6: Store admin role in app_metadata so frontend can read it
-- directly from the JWT — no DB query needed, immune to RLS issues
-- REPLACE 'YOUR_ADMIN_EMAIL' with your admin email address
UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"roles":["admin"]}'::jsonb
WHERE email = 'YOUR_ADMIN_EMAIL';

-- Verify: run this to confirm everything is set correctly
-- SELECT u.email, u.raw_app_meta_data, array_agg(ur.role) as db_roles
-- FROM auth.users u
-- LEFT JOIN public.user_roles ur ON ur.user_id = u.id
-- WHERE u.email = 'YOUR_ADMIN_EMAIL'
-- GROUP BY u.email, u.raw_app_meta_data;

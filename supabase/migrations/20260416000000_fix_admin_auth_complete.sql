-- ============================================================
-- COMPREHENSIVE FIX MIGRATION FOR SWIFT GHANA
-- Run in: Supabase Dashboard → SQL Editor → New Query
--
-- BEFORE RUNNING: Replace 'YOUR_ADMIN_EMAIL' with your actual admin email
--
-- This migration fixes ALL three reported issues:
--   1. All admin dashboard pages returning "failed error"
--   2. Adding new data packages failing
--   3. "Database error creating new user" on signup
-- ============================================================

-- ═══════════════════════════════════════════════════════════════
-- PART A: Fix user_roles constraint and RLS policies
-- Root cause of all admin API failures: admin has no 'admin' row in user_roles,
-- and the "Admins can manage roles" FOR ALL policy was blocking the
-- handle_new_user trigger INSERT (auth.uid() is NULL in trigger context →
-- has_role returns FALSE → INSERT denied even for SECURITY DEFINER functions
-- when Supabase has FORCE ROW LEVEL SECURITY enabled).
-- ═══════════════════════════════════════════════════════════════

-- A1: Fix unique constraint (was incorrectly UNIQUE(user_id) in some DB states)
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_key;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

-- A2: Drop ALL existing RLS policies on user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Service role can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_read_own_roles" ON public.user_roles;
DROP POLICY IF EXISTS "service_role_manage_roles" ON public.user_roles;
DROP POLICY IF EXISTS "admins_view_all_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Enable all for service role" ON public.user_roles;
DROP POLICY IF EXISTS "Users can add agent role to self" ON public.user_roles;

-- A3: Clean, non-recursive RLS policies on user_roles
-- Regular authenticated users: read their own roles
CREATE POLICY "users_read_own_roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Admins: read all roles (needed for admin dashboard agent count)
-- has_role() is SECURITY DEFINER so it bypasses user_roles RLS internally — no recursion
CREATE POLICY "admins_view_all_roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Service role (server-side API with service key): full access
CREATE POLICY "service_role_manage_roles" ON public.user_roles
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════
-- PART B: get_my_roles() RPC — reliable client-side role fetch
-- ═══════════════════════════════════════════════════════════════

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

-- ═══════════════════════════════════════════════════════════════
-- PART C: Fix handle_new_user trigger
-- Fixes "Database error creating new user".
--
-- Root cause: Supabase enables FORCE ROW LEVEL SECURITY on tables,
-- meaning even SECURITY DEFINER functions owned by postgres are subject
-- to RLS. The old trigger had no ON CONFLICT handling and the
-- "Admins can manage roles" FOR ALL policy blocked its INSERT into
-- user_roles (auth.uid() = NULL in trigger context → has_role = FALSE).
--
-- Fix: SET LOCAL row_security = off bypasses FORCE RLS for this
-- transaction (valid because postgres is a superuser), and ON CONFLICT
-- DO NOTHING makes the trigger idempotent.
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
AS $$
BEGIN
  -- Bypass FORCE ROW LEVEL SECURITY for this trigger execution.
  -- postgres (superuser) can always turn off row_security, even with FORCE RLS.
  SET LOCAL row_security = off;

  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.email, '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- PART D: Admin SELECT policies on tables used by admin dashboard
-- admin.index.tsx and admin.withdrawals.tsx use direct Supabase
-- client queries — these need admin-level visibility policies.
-- ═══════════════════════════════════════════════════════════════

-- D1: profiles — admin can see all profiles
DROP POLICY IF EXISTS "admins_view_all_profiles" ON public.profiles;
CREATE POLICY "admins_view_all_profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- D2: orders (created via Dashboard — wrap in DO block in case policies differ)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'orders'
  ) THEN
    EXECUTE $p$
      DROP POLICY IF EXISTS "admins_view_all_orders" ON public.orders;
      CREATE POLICY "admins_view_all_orders" ON public.orders
        FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
    $p$;
  END IF;
END;
$$;

-- D3: withdrawals
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'withdrawals'
  ) THEN
    EXECUTE $p$
      DROP POLICY IF EXISTS "admins_view_all_withdrawals" ON public.withdrawals;
      CREATE POLICY "admins_view_all_withdrawals" ON public.withdrawals
        FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
    $p$;
  END IF;
END;
$$;

-- D4: wallets
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'wallets'
  ) THEN
    EXECUTE $p$
      DROP POLICY IF EXISTS "admins_view_all_wallets" ON public.wallets;
      CREATE POLICY "admins_view_all_wallets" ON public.wallets
        FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
    $p$;
  END IF;
END;
$$;

-- D5: global_package_settings — enable RLS and allow public read
-- (packages must be visible to agents and customers browsing the store)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'global_package_settings'
  ) THEN
    ALTER TABLE public.global_package_settings ENABLE ROW LEVEL SECURITY;
    EXECUTE $p$
      DROP POLICY IF EXISTS "public_read_packages" ON public.global_package_settings;
      CREATE POLICY "public_read_packages" ON public.global_package_settings
        FOR SELECT USING (true);
    $p$;
  END IF;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- PART E: Ensure validity column exists and packages are seeded
-- ═══════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'global_package_settings'
  ) THEN
    -- Add validity column if missing (idempotent)
    ALTER TABLE public.global_package_settings
      ADD COLUMN IF NOT EXISTS validity text NOT NULL DEFAULT 'No Expiry';

    -- Seed default packages only if the table is completely empty
    IF NOT EXISTS (SELECT 1 FROM public.global_package_settings LIMIT 1) THEN
      INSERT INTO public.global_package_settings
        (network, package_size, public_price, agent_price, is_unavailable, validity)
      VALUES
        ('MTN',        '1GB',  5,    4,    false, 'No Expiry'),
        ('MTN',        '2GB',  9,    7.5,  false, 'No Expiry'),
        ('MTN',        '5GB',  20,   16,   false, 'No Expiry'),
        ('MTN',        '10GB', 35,   28,   false, 'No Expiry'),
        ('MTN',        '20GB', 60,   48,   false, 'No Expiry'),
        ('MTN',        '50GB', 120,  96,   false, 'No Expiry'),
        ('AirtelTigo', '1GB',  4.5,  3.5,  false, 'No Expiry'),
        ('AirtelTigo', '2GB',  8,    6.5,  false, 'No Expiry'),
        ('AirtelTigo', '5GB',  18,   14.5, false, 'No Expiry'),
        ('AirtelTigo', '10GB', 32,   26,   false, 'No Expiry'),
        ('AirtelTigo', '20GB', 55,   44,   false, 'No Expiry'),
        ('Telecel',    '1GB',  4.8,  3.8,  false, 'No Expiry'),
        ('Telecel',    '2GB',  8.5,  7,    false, 'No Expiry'),
        ('Telecel',    '5GB',  19,   15,   false, 'No Expiry'),
        ('Telecel',    '10GB', 33,   27,   false, 'No Expiry'),
        ('Telecel',    '15GB', 45,   36,   false, 'No Expiry');
    END IF;
  END IF;
END;
$$;

-- ═══════════════════════════════════════════════════════════════
-- PART F: Grant admin role to admin user
-- REPLACE 'YOUR_ADMIN_EMAIL' with your actual admin email address
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'YOUR_ADMIN_EMAIL'
ON CONFLICT (user_id, role) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- PART G: Store admin role in JWT app_metadata
-- This allows the frontend to read the admin role directly from the
-- JWT token — no DB query needed, completely immune to RLS issues.
-- REPLACE 'YOUR_ADMIN_EMAIL' with your actual admin email address
-- ═══════════════════════════════════════════════════════════════

UPDATE auth.users
SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"roles":["admin"]}'::jsonb
WHERE email = 'YOUR_ADMIN_EMAIL';

-- ═══════════════════════════════════════════════════════════════
-- VERIFICATION (uncomment and run separately after migration)
-- ═══════════════════════════════════════════════════════════════

-- SELECT u.email, u.raw_app_meta_data, array_agg(ur.role) as db_roles
-- FROM auth.users u
-- LEFT JOIN public.user_roles ur ON ur.user_id = u.id
-- WHERE u.email = 'YOUR_ADMIN_EMAIL'
-- GROUP BY u.email, u.raw_app_meta_data;

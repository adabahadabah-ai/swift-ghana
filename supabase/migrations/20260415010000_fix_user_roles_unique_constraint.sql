-- The user_roles table had a single-column UNIQUE(user_id) constraint which
-- prevents users from having more than one role (e.g. both 'user' and 'admin').
-- Drop it and replace with the correct composite UNIQUE(user_id, role).
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_key;

ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_role_key;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);

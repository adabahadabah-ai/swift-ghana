
-- Allow authenticated users to insert their own agent role
CREATE POLICY "Users can add agent role to self" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND role = 'agent');

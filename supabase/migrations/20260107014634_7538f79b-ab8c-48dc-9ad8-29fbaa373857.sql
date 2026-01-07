-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Super admins can manage permissions" ON public.admin_permissions;

-- Create a helper function to check super admin status without recursion
CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_permissions
    WHERE user_id = check_user_id AND can_add_admins = true
  );
$$;

-- Create new non-recursive policy using the helper function
CREATE POLICY "Super admins can manage permissions" ON public.admin_permissions
FOR ALL
USING (public.is_super_admin(auth.uid()));

-- Also add admin permissions for sussomorro74@gmail.com
INSERT INTO public.admin_permissions (user_id, can_add_admins, can_manage_students, can_manage_teachers, can_approve_grades, can_upload_bulk_data)
VALUES ('bfe7c918-2d55-4c2b-b954-8c9a909702fb', true, true, true, true, true)
ON CONFLICT (user_id) DO NOTHING;
-- Fix infinite recursion in student_guardians policy for guardians
DROP POLICY IF EXISTS "Guardians can view their students" ON public.student_guardians;

-- Create a security definer function to check guardian relationship
CREATE OR REPLACE FUNCTION public.is_guardian_of_student(_guardian_user_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM student_guardians sg
    JOIN guardians g ON sg.guardian_id = g.id
    WHERE sg.student_id = _student_id
    AND g.user_id = _guardian_user_id
  )
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Guardians can view their students"
ON public.student_guardians
FOR SELECT
TO authenticated
USING (is_guardian_of_student(auth.uid(), student_id));
-- Drop the problematic policy that's causing recursion
DROP POLICY IF EXISTS "Teachers can view students in their classes" ON public.students;

-- Create a security definer function to check if teacher has student in their class
CREATE OR REPLACE FUNCTION public.teacher_has_student(_teacher_id uuid, _student_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM class_students cs
    JOIN classes c ON cs.class_id = c.id
    WHERE cs.student_id = _student_id
    AND c.teacher_id = _teacher_id
  )
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "Teachers can view students in their classes"
ON public.students
FOR SELECT
TO authenticated
USING (teacher_has_student(auth.uid(), id));

-- Add user_agent column to attendances for device fingerprinting
ALTER TABLE public.attendances
ADD COLUMN IF NOT EXISTS user_agent text,
ADD COLUMN IF NOT EXISTS device_fingerprint text;

-- Create index for performance on attendance queries
CREATE INDEX IF NOT EXISTS idx_attendances_date ON public.attendances(attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendances_class_date ON public.attendances(class_id, attendance_date);
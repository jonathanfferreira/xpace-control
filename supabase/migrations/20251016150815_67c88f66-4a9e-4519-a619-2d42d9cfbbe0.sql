-- Fix 1: Resolve infinite recursion in RLS policies
-- Add school_id to class_students to avoid circular dependency
ALTER TABLE public.class_students
  ADD COLUMN IF NOT EXISTS school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE;

-- Populate school_id for existing records
UPDATE public.class_students cs
SET school_id = c.school_id
FROM public.classes c
WHERE cs.class_id = c.id
  AND cs.school_id IS NULL;

-- Make school_id NOT NULL after populating
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'class_students' 
    AND column_name = 'school_id' 
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.class_students ALTER COLUMN school_id SET NOT NULL;
  END IF;
END $$;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Admins can manage enrollments in their school" ON public.class_students;
DROP POLICY IF EXISTS "Admins can view enrollments in their school" ON public.class_students;
DROP POLICY IF EXISTS "Students/Parents can view their classes" ON public.classes;

-- Recreate class_students policies without circular dependency
CREATE POLICY "Admins can manage enrollments in their school"
  ON public.class_students FOR ALL
  USING (school_id = get_user_school(auth.uid()));

CREATE POLICY "Admins can view enrollments in their school"
  ON public.class_students FOR SELECT
  USING (school_id = get_user_school(auth.uid()));

-- Recreate classes policy using SECURITY DEFINER function instead of join
CREATE POLICY "Students/Parents can view their classes"
  ON public.classes FOR SELECT
  USING (user_has_student_in_class(auth.uid(), id));

-- Fix 2: Add missing UPDATE and DELETE policies to user_roles (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'Admins can update roles'
  ) THEN
    CREATE POLICY "Admins can update roles"
      ON public.user_roles FOR UPDATE
      USING (has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_roles' 
    AND policyname = 'Admins can delete roles'
  ) THEN
    CREATE POLICY "Admins can delete roles"
      ON public.user_roles FOR DELETE
      USING (
        has_role(auth.uid(), 'admin') 
        AND user_id != auth.uid() -- Prevent self-demotion
      );
  END IF;
END $$;

-- Fix 3: Ensure admin role bootstrap works correctly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Auto-assign admin role to allow school creation
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;
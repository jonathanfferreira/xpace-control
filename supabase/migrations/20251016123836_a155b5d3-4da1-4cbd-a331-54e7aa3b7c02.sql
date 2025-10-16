-- Fix critical security issues and enable full functionality

-- 1. Fix infinite recursion: Add helper function for checking student-class relationship
CREATE OR REPLACE FUNCTION public.user_has_student_in_class(_user_id uuid, _class_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM class_students cs
    JOIN students s ON cs.student_id = s.id
    WHERE s.parent_id = _user_id
      AND cs.class_id = _class_id
  )
$$;

-- 2. Fix infinite recursion: Add helper function for school context
CREATE OR REPLACE FUNCTION public.class_belongs_to_user_school(_class_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM classes c
    WHERE c.id = _class_id
      AND c.school_id = get_user_school(_user_id)
  )
$$;

-- 3. Drop problematic policies and recreate without recursion
DROP POLICY IF EXISTS "Students/Parents can view their classes" ON public.classes;
DROP POLICY IF EXISTS "Admins can manage enrollments in their school" ON public.class_students;
DROP POLICY IF EXISTS "Admins can view enrollments in their school" ON public.class_students;

-- Recreate classes policy using helper function
CREATE POLICY "Students/Parents can view their classes"
  ON public.classes FOR SELECT
  USING (user_has_student_in_class(auth.uid(), id));

-- Recreate class_students policies using helper function
CREATE POLICY "Admins can manage enrollments in their school"
  ON public.class_students FOR ALL
  USING (class_belongs_to_user_school(class_id, auth.uid()));

CREATE POLICY "Admins can view enrollments in their school"
  ON public.class_students FOR SELECT
  USING (class_belongs_to_user_school(class_id, auth.uid()));

-- 4. Fix admin bootstrap: Auto-assign admin role on signup
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
  VALUES (NEW.id, 'admin');
  
  RETURN NEW;
END;
$$;

-- 5. Add missing role management policies
CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- 6. Add missing school deletion policy
CREATE POLICY "Admins can delete their own school"
  ON public.schools FOR DELETE
  USING (auth.uid() = admin_id);

-- 7. Add input validation constraints
ALTER TABLE public.profiles
  ADD CONSTRAINT full_name_length CHECK (length(full_name) >= 2 AND length(full_name) <= 100);

ALTER TABLE public.profiles
  ADD CONSTRAINT phone_format CHECK (phone IS NULL OR phone ~ '^\+?[0-9]{10,15}$');

-- 8. Fix update_updated_at_column to set search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
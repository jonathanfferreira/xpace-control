-- Fix: Missing server-side input validation
-- Add validation function for profiles table
CREATE OR REPLACE FUNCTION public.validate_profile_data()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate full_name length
  IF length(trim(NEW.full_name)) < 3 THEN
    RAISE EXCEPTION 'Nome completo deve ter no mínimo 3 caracteres';
  END IF;
  
  IF length(NEW.full_name) > 100 THEN
    RAISE EXCEPTION 'Nome completo deve ter no máximo 100 caracteres';
  END IF;
  
  -- Validate phone format if provided
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND 
     NOT (NEW.phone ~ '^[+]?[0-9()\s-]{10,20}$') THEN
    RAISE EXCEPTION 'Formato de telefone inválido';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for profiles validation
DROP TRIGGER IF EXISTS validate_profile_before_insert ON public.profiles;
CREATE TRIGGER validate_profile_before_insert
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_data();

-- Add validation for leads table
ALTER TABLE public.leads 
  DROP CONSTRAINT IF EXISTS valid_email;

ALTER TABLE public.leads 
  ADD CONSTRAINT valid_email 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

ALTER TABLE public.leads 
  DROP CONSTRAINT IF EXISTS valid_whatsapp;

ALTER TABLE public.leads 
  ADD CONSTRAINT valid_whatsapp 
  CHECK (whatsapp ~ '^[0-9()+\s-]{10,20}$');

ALTER TABLE public.leads
  DROP CONSTRAINT IF EXISTS valid_school_name;

ALTER TABLE public.leads
  ADD CONSTRAINT valid_school_name
  CHECK (length(trim(school_name)) >= 3 AND length(school_name) <= 200);

-- Add validation for students table PII fields
CREATE OR REPLACE FUNCTION public.validate_student_data()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate full_name
  IF length(trim(NEW.full_name)) < 3 THEN
    RAISE EXCEPTION 'Nome completo deve ter no mínimo 3 caracteres';
  END IF;
  
  IF length(NEW.full_name) > 100 THEN
    RAISE EXCEPTION 'Nome completo deve ter no máximo 100 caracteres';
  END IF;
  
  -- Validate email format if provided
  IF NEW.email IS NOT NULL AND NEW.email != '' AND
     NOT (NEW.email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$') THEN
    RAISE EXCEPTION 'Formato de email inválido';
  END IF;
  
  -- Validate phone format if provided
  IF NEW.phone IS NOT NULL AND NEW.phone != '' AND
     NOT (NEW.phone ~ '^[+]?[0-9()\s-]{10,20}$') THEN
    RAISE EXCEPTION 'Formato de telefone inválido';
  END IF;
  
  -- Validate emergency phone if provided
  IF NEW.emergency_phone IS NOT NULL AND NEW.emergency_phone != '' AND
     NOT (NEW.emergency_phone ~ '^[+]?[0-9()\s-]{10,20}$') THEN
    RAISE EXCEPTION 'Formato de telefone de emergência inválido';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for students validation
DROP TRIGGER IF EXISTS validate_student_before_insert ON public.students;
CREATE TRIGGER validate_student_before_insert
  BEFORE INSERT OR UPDATE ON public.students
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_student_data();

-- Fix: Audit logs table missing INSERT policy
-- Create SECURITY DEFINER function for controlled audit logging
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _action text,
  _table_name text,
  _record_id uuid,
  _details jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    table_name,
    record_id,
    details
  ) VALUES (
    auth.uid(),
    _action,
    _table_name,
    _record_id,
    _details
  );
END;
$$;

-- Add INSERT policy for audit_logs (allows authenticated users to log via the function)
CREATE POLICY "Authenticated users can insert audit logs via function"
  ON public.audit_logs 
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
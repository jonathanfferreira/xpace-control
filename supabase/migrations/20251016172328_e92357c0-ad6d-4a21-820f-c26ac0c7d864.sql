-- Update handle_new_user trigger to validate inputs
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Validate full name
  IF NEW.raw_user_meta_data->>'full_name' IS NULL OR 
     length(NEW.raw_user_meta_data->>'full_name') < 3 THEN
    RAISE EXCEPTION 'Nome completo deve ter no mínimo 3 caracteres';
  END IF;

  IF length(NEW.raw_user_meta_data->>'full_name') > 100 THEN
    RAISE EXCEPTION 'Nome completo muito longo (máximo 100 caracteres)';
  END IF;

  -- Validate phone format if provided
  IF NEW.raw_user_meta_data->>'phone' IS NOT NULL AND 
     NEW.raw_user_meta_data->>'phone' != '' AND
     NOT (NEW.raw_user_meta_data->>'phone' ~ '^[+]?[0-9]{10,15}$') THEN
    RAISE EXCEPTION 'Formato de telefone inválido';
  END IF;

  -- Create profile
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  );
  
  -- Auto-assign admin role to allow school creation
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Create guardian_invites tracking table for audit and compliance
CREATE TABLE IF NOT EXISTS public.guardian_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL,
  guardian_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT valid_invite_status CHECK (status IN ('pending', 'accepted', 'expired', 'revoked'))
);

CREATE INDEX IF NOT EXISTS idx_guardian_invites_email ON public.guardian_invites(guardian_email);
CREATE INDEX IF NOT EXISTS idx_guardian_invites_token ON public.guardian_invites(token);
CREATE INDEX IF NOT EXISTS idx_guardian_invites_status ON public.guardian_invites(status);
CREATE INDEX IF NOT EXISTS idx_guardian_invites_student ON public.guardian_invites(student_id);

ALTER TABLE public.guardian_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage guardian invites"
  ON public.guardian_invites FOR ALL
  USING (school_id = get_user_school(auth.uid()));

CREATE POLICY "Users can view their own invites"
  ON public.guardian_invites FOR SELECT
  USING (guardian_email IN (
    SELECT email FROM auth.users WHERE id = auth.uid()
  ));

-- Create audit log table for PII access tracking
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  details jsonb,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

COMMENT ON TABLE public.students IS 'Contains PII - access logged for LGPD compliance. Parental consent required for minors.';
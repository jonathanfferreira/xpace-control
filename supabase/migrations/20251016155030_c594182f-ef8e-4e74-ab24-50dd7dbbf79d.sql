-- Insert default plans
INSERT INTO public.plans (name, monthly_price, student_limit, features, active)
VALUES 
  (
    'Start',
    49.00,
    50,
    '["Até 50 alunos", "Presença por QR Code", "Gestão de turmas", "Relatórios básicos", "Suporte por email"]'::jsonb,
    true
  ),
  (
    'Pro',
    99.00,
    NULL,
    '["Alunos ilimitados", "Presença por QR Code", "Gestão de turmas", "Relatórios avançados", "CRM de Leads", "Gestão financeira", "Suporte prioritário", "API de integração"]'::jsonb,
    true
  )
ON CONFLICT DO NOTHING;

-- Update handle_new_user function to create trial subscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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

-- Create function to initialize school subscription
CREATE OR REPLACE FUNCTION public.create_trial_subscription(_school_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _start_plan_id uuid;
BEGIN
  -- Get the Start plan ID
  SELECT id INTO _start_plan_id
  FROM public.plans
  WHERE name = 'Start' AND active = true
  LIMIT 1;
  
  -- Create trial subscription (15 days)
  INSERT INTO public.subscriptions (school_id, plan_id, status, renew_at)
  VALUES (
    _school_id,
    _start_plan_id,
    'trial',
    CURRENT_DATE + INTERVAL '15 days'
  );
END;
$$;
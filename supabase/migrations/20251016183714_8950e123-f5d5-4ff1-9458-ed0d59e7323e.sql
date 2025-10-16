-- Add unique constraint to plan names
ALTER TABLE public.plans ADD CONSTRAINT plans_name_key UNIQUE (name);

-- Upsert plans
DO $$
DECLARE
  start_plan_id uuid;
  pro_plan_id uuid;
  enterprise_plan_id uuid;
BEGIN
  -- Insert or update Start plan
  INSERT INTO public.plans (name, monthly_price, student_limit, features, active)
  VALUES (
    'Start',
    49.00,
    50,
    '["Até 50 alunos ativos", "Controle de presença com QR Code", "Gestão de turmas e horários", "Relatórios básicos", "Notificações por WhatsApp", "Sistema de gamificação", "Suporte por email"]'::jsonb,
    true
  )
  ON CONFLICT (name) 
  DO UPDATE SET 
    monthly_price = 49.00,
    student_limit = 50,
    features = '["Até 50 alunos ativos", "Controle de presença com QR Code", "Gestão de turmas e horários", "Relatórios básicos", "Notificações por WhatsApp", "Sistema de gamificação", "Suporte por email"]'::jsonb,
    active = true;

  -- Insert or update Pro plan
  INSERT INTO public.plans (name, monthly_price, student_limit, features, active)
  VALUES (
    'Pro',
    99.00,
    NULL,
    '["Alunos ilimitados", "Controle de presença com QR Code", "Gestão de turmas e horários", "Relatórios avançados e análises", "Notificações por WhatsApp", "Sistema de gamificação", "Gestão financeira completa", "Múltiplas unidades", "API de integração", "Suporte prioritário"]'::jsonb,
    true
  )
  ON CONFLICT (name) 
  DO UPDATE SET 
    monthly_price = 99.00,
    student_limit = NULL,
    features = '["Alunos ilimitados", "Controle de presença com QR Code", "Gestão de turmas e horários", "Relatórios avançados e análises", "Notificações por WhatsApp", "Sistema de gamificação", "Gestão financeira completa", "Múltiplas unidades", "API de integração", "Suporte prioritário"]'::jsonb,
    active = true;

  -- Insert or update Enterprise plan
  INSERT INTO public.plans (name, monthly_price, student_limit, features, active)
  VALUES (
    'Enterprise',
    0.00,
    NULL,
    '["Todos os recursos do Pro", "Plano personalizado", "Implementação dedicada", "Treinamento da equipe", "SLA garantido", "Suporte 24/7", "Consultoria especializada"]'::jsonb,
    true
  )
  ON CONFLICT (name) 
  DO UPDATE SET 
    monthly_price = 0.00,
    student_limit = NULL,
    features = '["Todos os recursos do Pro", "Plano personalizado", "Implementação dedicada", "Treinamento da equipe", "SLA garantido", "Suporte 24/7", "Consultoria especializada"]'::jsonb,
    active = true;
END $$;

-- Function to create trial subscription when school is created
CREATE OR REPLACE FUNCTION public.create_trial_subscription(_school_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Trigger to automatically create trial subscription when a school is created
CREATE OR REPLACE FUNCTION public.handle_new_school()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create trial subscription for the new school
  PERFORM create_trial_subscription(NEW.id);
  RETURN NEW;
END;
$$;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_school_created ON public.schools;
CREATE TRIGGER on_school_created
  AFTER INSERT ON public.schools
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_school();
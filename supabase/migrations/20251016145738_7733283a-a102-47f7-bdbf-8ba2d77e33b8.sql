-- Add notification preferences to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_on_absence boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS email_on_late_payment boolean DEFAULT true;

-- Add multi-unit support
CREATE TABLE IF NOT EXISTS public.school_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name text NOT NULL,
  address text,
  city text,
  phone text,
  active boolean DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.school_units ENABLE ROW LEVEL SECURITY;

-- Policies for school_units
CREATE POLICY "Admins can view units in their school"
  ON public.school_units FOR SELECT
  USING (school_id = get_user_school(auth.uid()));

CREATE POLICY "Admins can manage units in their school"
  ON public.school_units FOR ALL
  USING (school_id = get_user_school(auth.uid()));

-- Add unit_id to existing tables
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.school_units(id) ON DELETE SET NULL;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES public.school_units(id) ON DELETE SET NULL;

-- Add trigger for school_units updated_at
CREATE TRIGGER update_school_units_updated_at
  BEFORE UPDATE ON public.school_units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create notifications log table
CREATE TABLE IF NOT EXISTS public.notifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  notification_type text NOT NULL CHECK (notification_type IN ('absence', 'late_payment', 'low_attendance')),
  message text NOT NULL,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending'))
);

-- Enable RLS on notifications_log
ALTER TABLE public.notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage notifications in their school"
  ON public.notifications_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.students s
      WHERE s.id = notifications_log.student_id
        AND s.school_id = get_user_school(auth.uid())
    )
  );
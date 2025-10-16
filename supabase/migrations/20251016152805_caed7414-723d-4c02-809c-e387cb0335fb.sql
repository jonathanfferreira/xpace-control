-- Extend app_role enum to include teacher
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';

-- Create guardians table (complementing existing profiles)
CREATE TABLE IF NOT EXISTS public.guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  phone text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create student_guardians junction table
CREATE TABLE IF NOT EXISTS public.student_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  guardian_id uuid REFERENCES public.guardians(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(student_id, guardian_id)
);

-- Create class_schedules table
CREATE TABLE IF NOT EXISTS public.class_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create enrollments table (enhanced version of class_students)
CREATE TABLE IF NOT EXISTS public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  start_date date DEFAULT CURRENT_DATE NOT NULL,
  end_date date,
  status text DEFAULT 'active' CHECK (status IN ('active', 'on_hold', 'completed')),
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(student_id, class_id)
);

-- Create qr_tokens table for QR-based attendance
CREATE TABLE IF NOT EXISTS public.qr_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
  token text UNIQUE NOT NULL,
  valid_from timestamp with time zone NOT NULL,
  valid_until timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create plans table for subscription tiers
CREATE TABLE IF NOT EXISTS public.plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  monthly_price numeric(10,2) NOT NULL,
  student_limit integer,
  features jsonb,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_id uuid REFERENCES public.plans(id) NOT NULL,
  status text DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'inactive', 'cancelled')),
  renew_at date,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid REFERENCES public.schools(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  event_date timestamp with time zone NOT NULL,
  location text,
  description text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create tickets table for event registrations
CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  buyer_name text NOT NULL,
  status text DEFAULT 'reserved' CHECK (status IN ('reserved', 'paid', 'cancelled')),
  amount numeric(10,2) NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add teacher_id to classes if not exists
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS teacher_id uuid REFERENCES auth.users(id);

-- Enable RLS on all new tables
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Guardians policies
CREATE POLICY "Guardians can view their own data"
  ON public.guardians FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Guardians can update their own data"
  ON public.guardians FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage guardians in their school"
  ON public.guardians FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.student_guardians sg ON s.id = sg.student_id
    WHERE sg.guardian_id = guardians.id
    AND s.school_id = get_user_school(auth.uid())
  ));

-- Student guardians policies
CREATE POLICY "Guardians can view their students"
  ON public.student_guardians FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.guardians g
    WHERE g.id = student_guardians.guardian_id
    AND g.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage student-guardian relationships"
  ON public.student_guardians FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.id = student_guardians.student_id
    AND s.school_id = get_user_school(auth.uid())
  ));

-- Class schedules policies
CREATE POLICY "Admins can manage class schedules"
  ON public.class_schedules FOR ALL
  USING (class_belongs_to_user_school(class_id, auth.uid()));

CREATE POLICY "Teachers can view their class schedules"
  ON public.class_schedules FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = class_schedules.class_id
    AND c.teacher_id = auth.uid()
  ));

CREATE POLICY "Students can view their class schedules"
  ON public.class_schedules FOR SELECT
  USING (user_has_student_in_class(auth.uid(), class_id));

-- Enrollments policies
CREATE POLICY "Admins can manage enrollments"
  ON public.enrollments FOR ALL
  USING (school_id = get_user_school(auth.uid()));

CREATE POLICY "Teachers can view their class enrollments"
  ON public.enrollments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = enrollments.class_id
    AND c.teacher_id = auth.uid()
  ));

CREATE POLICY "Guardians can view their students enrollments"
  ON public.enrollments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.student_guardians sg
    JOIN public.guardians g ON sg.guardian_id = g.id
    WHERE sg.student_id = enrollments.student_id
    AND g.user_id = auth.uid()
  ));

-- QR tokens policies
CREATE POLICY "Admins can manage QR tokens"
  ON public.qr_tokens FOR ALL
  USING (class_belongs_to_user_school(class_id, auth.uid()));

CREATE POLICY "Teachers can manage their class QR tokens"
  ON public.qr_tokens FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = qr_tokens.class_id
    AND c.teacher_id = auth.uid()
  ));

CREATE POLICY "Students can view valid QR tokens for their classes"
  ON public.qr_tokens FOR SELECT
  USING (
    user_has_student_in_class(auth.uid(), class_id)
    AND valid_from <= now()
    AND valid_until >= now()
  );

-- Plans policies (public read, admin manage)
CREATE POLICY "Anyone can view active plans"
  ON public.plans FOR SELECT
  USING (active = true);

CREATE POLICY "System admins can manage plans"
  ON public.plans FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Subscriptions policies
CREATE POLICY "Admins can view their school subscription"
  ON public.subscriptions FOR SELECT
  USING (school_id = get_user_school(auth.uid()));

CREATE POLICY "Admins can manage their school subscription"
  ON public.subscriptions FOR ALL
  USING (school_id = get_user_school(auth.uid()));

-- Events policies
CREATE POLICY "Admins can manage events in their school"
  ON public.events FOR ALL
  USING (school_id = get_user_school(auth.uid()));

CREATE POLICY "Teachers can view events in their school"
  ON public.events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.teacher_id = auth.uid()
    AND c.school_id = events.school_id
  ));

CREATE POLICY "Guardians can view events"
  ON public.events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.student_guardians sg ON s.id = sg.student_id
    JOIN public.guardians g ON sg.guardian_id = g.id
    WHERE g.user_id = auth.uid()
    AND s.school_id = events.school_id
  ));

-- Tickets policies
CREATE POLICY "Admins can manage all tickets in their school"
  ON public.tickets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.events e
    WHERE e.id = tickets.event_id
    AND e.school_id = get_user_school(auth.uid())
  ));

CREATE POLICY "Guardians can view and manage their tickets"
  ON public.tickets FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.students s
    JOIN public.student_guardians sg ON s.id = sg.student_id
    JOIN public.guardians g ON sg.guardian_id = g.id
    WHERE g.user_id = auth.uid()
    AND (tickets.student_id = s.id OR tickets.student_id IS NULL)
  ));

-- Update triggers for updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_guardians_student ON public.student_guardians(student_id);
CREATE INDEX IF NOT EXISTS idx_student_guardians_guardian ON public.student_guardians(guardian_id);
CREATE INDEX IF NOT EXISTS idx_class_schedules_class ON public.class_schedules(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON public.enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_school ON public.enrollments(school_id);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_class ON public.qr_tokens(class_id);
CREATE INDEX IF NOT EXISTS idx_qr_tokens_valid ON public.qr_tokens(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_subscriptions_school ON public.subscriptions(school_id);
CREATE INDEX IF NOT EXISTS idx_events_school ON public.events(school_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_student ON public.tickets(student_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes(teacher_id);
-- ========================================
-- 1. ADICIONAR ROLE 'guardian' AO ENUM
-- ========================================
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'guardian';

-- ========================================
-- 2. TABELAS PARA PORTAL DO RESPONSÁVEL
-- ========================================

-- Tabela de responsáveis já existe (guardians), vamos garantir que está ok
-- A tabela guardians já existe no schema

-- Tabela de relação aluno-responsável já existe (student_guardians)
-- student_guardians já existe no schema

-- ========================================
-- 3. TABELAS PARA GAMIFICAÇÃO
-- ========================================

-- Tabela de pontos dos alunos
CREATE TABLE IF NOT EXISTS public.student_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  reason TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de conquistas/badges disponíveis
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  points_required INTEGER NOT NULL,
  badge_color TEXT NOT NULL DEFAULT '#6324b2',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de conquistas desbloqueadas pelos alunos
CREATE TABLE IF NOT EXISTS public.student_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(student_id, achievement_id)
);

-- ========================================
-- 4. TABELA PARA WHATSAPP NOTIFICATIONS
-- ========================================

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'class_reminder', 'payment_overdue', 'enrollment_confirmation'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ========================================
-- 5. ENABLE RLS
-- ========================================

ALTER TABLE public.student_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 6. RLS POLICIES - STUDENT POINTS
-- ========================================

CREATE POLICY "Admins can manage student points"
ON public.student_points
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = student_points.student_id
    AND s.school_id = get_user_school(auth.uid())
  )
);

CREATE POLICY "Students can view their own points"
ON public.student_points
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = student_points.student_id
    AND s.parent_id = auth.uid()
  )
);

CREATE POLICY "Guardians can view their students points"
ON public.student_points
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM student_guardians sg
    JOIN guardians g ON sg.guardian_id = g.id
    WHERE sg.student_id = student_points.student_id
    AND g.user_id = auth.uid()
  )
);

-- ========================================
-- 7. RLS POLICIES - ACHIEVEMENTS
-- ========================================

CREATE POLICY "Anyone can view achievements"
ON public.achievements
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage achievements"
ON public.achievements
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- ========================================
-- 8. RLS POLICIES - STUDENT ACHIEVEMENTS
-- ========================================

CREATE POLICY "Admins can view all student achievements"
ON public.student_achievements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = student_achievements.student_id
    AND s.school_id = get_user_school(auth.uid())
  )
);

CREATE POLICY "Students can view their own achievements"
ON public.student_achievements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = student_achievements.student_id
    AND s.parent_id = auth.uid()
  )
);

CREATE POLICY "Guardians can view their students achievements"
ON public.student_achievements
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM student_guardians sg
    JOIN guardians g ON sg.guardian_id = g.id
    WHERE sg.student_id = student_achievements.student_id
    AND g.user_id = auth.uid()
  )
);

-- ========================================
-- 9. RLS POLICIES - WHATSAPP MESSAGES
-- ========================================

CREATE POLICY "Admins can manage whatsapp messages"
ON public.whatsapp_messages
FOR ALL
TO authenticated
USING (
  student_id IS NULL OR
  EXISTS (
    SELECT 1 FROM students s
    WHERE s.id = whatsapp_messages.student_id
    AND s.school_id = get_user_school(auth.uid())
  )
);

-- ========================================
-- 10. TRIGGER PARA ADICIONAR PONTOS
-- ========================================

-- Função para adicionar pontos quando aluno tem presença
CREATE OR REPLACE FUNCTION public.add_points_on_attendance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Adicionar 10 pontos por presença
  INSERT INTO public.student_points (student_id, points, reason)
  VALUES (NEW.student_id, 10, 'Presença na aula');
  
  RETURN NEW;
END;
$$;

-- Trigger quando nova presença é registrada
DROP TRIGGER IF EXISTS trigger_add_points_on_attendance ON public.attendances;
CREATE TRIGGER trigger_add_points_on_attendance
AFTER INSERT ON public.attendances
FOR EACH ROW
EXECUTE FUNCTION public.add_points_on_attendance();

-- ========================================
-- 11. FUNÇÃO PARA CHECAR E DESBLOQUEAR CONQUISTAS
-- ========================================

CREATE OR REPLACE FUNCTION public.check_and_unlock_achievements()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_points INTEGER;
  achievement RECORD;
BEGIN
  -- Calcular total de pontos do aluno
  SELECT COALESCE(SUM(points), 0) INTO total_points
  FROM public.student_points
  WHERE student_id = NEW.student_id;
  
  -- Verificar conquistas que podem ser desbloqueadas
  FOR achievement IN
    SELECT a.id, a.points_required
    FROM public.achievements a
    WHERE a.points_required <= total_points
    AND NOT EXISTS (
      SELECT 1 FROM public.student_achievements sa
      WHERE sa.student_id = NEW.student_id
      AND sa.achievement_id = a.id
    )
  LOOP
    -- Desbloquear conquista
    INSERT INTO public.student_achievements (student_id, achievement_id)
    VALUES (NEW.student_id, achievement.id);
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Trigger para checar conquistas quando pontos são adicionados
DROP TRIGGER IF EXISTS trigger_check_achievements ON public.student_points;
CREATE TRIGGER trigger_check_achievements
AFTER INSERT ON public.student_points
FOR EACH ROW
EXECUTE FUNCTION public.check_and_unlock_achievements();

-- ========================================
-- 12. INSERIR CONQUISTAS PADRÃO
-- ========================================

INSERT INTO public.achievements (name, description, icon, points_required, badge_color)
VALUES
  ('Iniciante', 'Completou 10 aulas', '🌟', 100, '#6324b2'),
  ('Dedicado', 'Completou 50 aulas', '⭐', 500, '#d946ef'),
  ('Mestre', 'Completou 100 aulas', '🏆', 1000, '#f59e0b'),
  ('Frequência Perfeita', 'Presença em 30 dias consecutivos', '🔥', 300, '#ef4444'),
  ('Estudante Exemplar', 'Acumulou 500 pontos', '💎', 500, '#3b82f6')
ON CONFLICT DO NOTHING;
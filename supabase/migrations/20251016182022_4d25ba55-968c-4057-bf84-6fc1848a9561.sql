-- Add 'teacher' and 'parent' to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'teacher';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'parent';
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'student';

-- RLS Policies for Teachers on classes table
CREATE POLICY "Teachers can view their own classes"
ON public.classes
FOR SELECT
TO authenticated
USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own classes"
ON public.classes
FOR UPDATE
TO authenticated
USING (teacher_id = auth.uid());

-- RLS Policies for Teachers on attendances table
CREATE POLICY "Teachers can view attendances for their classes"
ON public.attendances
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = attendances.class_id
    AND c.teacher_id = auth.uid()
  )
);

CREATE POLICY "Teachers can manage attendances for their classes"
ON public.attendances
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = attendances.class_id
    AND c.teacher_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = attendances.class_id
    AND c.teacher_id = auth.uid()
  )
);

-- Allow teachers to view students in their classes
CREATE POLICY "Teachers can view students in their classes"
ON public.students
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM class_students cs
    JOIN classes c ON cs.class_id = c.id
    WHERE cs.student_id = students.id
    AND c.teacher_id = auth.uid()
  )
);

-- Allow teachers to view class schedules for their classes
CREATE POLICY "Teachers can view schedules for their classes"
ON public.class_schedules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = class_schedules.class_id
    AND c.teacher_id = auth.uid()
  )
);
import { z } from 'zod';

export const studentSchema = z.object({
  full_name: z.string().trim().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100, 'Nome muito longo'),
  email: z.string().trim().email('Email inválido').max(255).optional().or(z.literal('')),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
  birth_date: z.string().optional().or(z.literal('')),
  emergency_contact: z.string().trim().max(100).optional().or(z.literal('')),
  emergency_phone: z.string().trim().max(20).optional().or(z.literal('')),
  unit_id: z.string().uuid().optional().nullable(),
  active: z.boolean().default(true),
});

export const guardianSchema = z.object({
  user_id: z.string().uuid(),
  phone: z.string().trim().max(20).optional().or(z.literal('')),
});

export const classSchema = z.object({
  name: z.string().trim().min(3, 'Nome deve ter no mínimo 3 caracteres').max(100, 'Nome muito longo'),
  description: z.string().trim().max(500).optional().or(z.literal('')),
  teacher_id: z.string().uuid().optional().nullable(),
  unit_id: z.string().uuid().optional().nullable(),
  schedule_day: z.string().min(1, 'Selecione um dia'),
  schedule_time: z.string().min(1, 'Informe o horário'),
  duration_minutes: z.number().min(15, 'Mínimo 15 minutos').max(240, 'Máximo 240 minutos').default(60),
  max_students: z.number().min(1).max(100).default(30),
  active: z.boolean().default(true),
});

export const enrollmentSchema = z.object({
  student_id: z.string().uuid('Selecione um aluno'),
  class_id: z.string().uuid('Selecione uma turma'),
  start_date: z.string().min(1, 'Informe a data de início'),
  end_date: z.string().optional().or(z.literal('')),
  status: z.enum(['active', 'on_hold', 'completed']).default('active'),
});

export const classScheduleSchema = z.object({
  class_id: z.string().uuid(),
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido'),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Horário inválido'),
});

export type StudentFormData = z.infer<typeof studentSchema>;
export type GuardianFormData = z.infer<typeof guardianSchema>;
export type ClassFormData = z.infer<typeof classSchema>;
export type EnrollmentFormData = z.infer<typeof enrollmentSchema>;
export type ClassScheduleFormData = z.infer<typeof classScheduleSchema>;

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Attendance = {
  id: string;
  student_id: string;
  class_id: string;
  attendance_date: string;
  marked_at: string;
  students: { full_name: string } | null;
  classes: { name: string } | null;
};

type ClassStudent = {
  student_id: string;
  students: { id: string; full_name: string } | null;
};

export default function TeacherAttendance() {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTeacherClasses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClass) {
      fetchAttendances();
    }
  }, [selectedClass, selectedDate]);

  const fetchTeacherClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user?.id);

      if (error) throw error;
      setTeacherClasses(data || []);
      if (data && data.length > 0) {
        setSelectedClass(data[0].id);
      }
    } catch (error: any) {
      toast.error('Erro ao carregar turmas');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('attendances')
        .select(`
          *,
          students (full_name),
          classes (name)
        `)
        .eq('class_id', selectedClass)
        .eq('attendance_date', format(selectedDate, 'yyyy-MM-dd'));

      if (error) throw error;
      setAttendances(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar presenças');
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId: string) => {
    try {
      const { error } = await supabase.from('attendances').insert({
        student_id: studentId,
        class_id: selectedClass,
        attendance_date: format(selectedDate, 'yyyy-MM-dd'),
        marked_by: user?.id,
      });

      if (error) throw error;
      toast.success('Presença marcada com sucesso');
      fetchAttendances();
    } catch (error: any) {
      toast.error('Erro ao marcar presença');
    }
  };

  const getClassStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('class_students')
        .select('student_id, students (id, full_name)')
        .eq('class_id', selectedClass);

      if (error) throw error;
      return data || [];
    } catch (error) {
      toast.error('Erro ao carregar alunos');
      return [];
    }
  };

  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);

  useEffect(() => {
    if (selectedClass) {
      getClassStudents().then(setClassStudents);
    }
  }, [selectedClass]);

  if (loading && teacherClasses.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Presenças</h1>
          <p className="text-muted-foreground">Gerencie as presenças das suas turmas</p>
        </div>

        <div className="flex gap-4 items-center">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-4 py-2 rounded-md border border-border bg-background"
          >
            {teacherClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('justify-start text-left font-normal')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, 'dd/MM/yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} />
            </PopoverContent>
          </Popover>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Alunos da Turma</CardTitle>
            <CardDescription>Marque presença manualmente para casos excepcionais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {classStudents.map((cs) => {
                const hasAttendance = attendances.some((a) => a.student_id === cs.student_id);
                return (
                  <div key={cs.student_id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <span className="font-medium">{cs.students?.full_name}</span>
                    {hasAttendance ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        <span className="text-sm">Presente</span>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => markAttendance(cs.student_id)}>
                        Marcar Presença
                      </Button>
                    )}
                  </div>
                );
              })}
              {classStudents.length === 0 && (
                <p className="text-muted-foreground text-center py-4">Nenhum aluno matriculado nesta turma</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

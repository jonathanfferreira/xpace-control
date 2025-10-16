import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const DAYS_OF_WEEK = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

type ClassSchedule = {
  id: string;
  class_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  classes: { name: string; description?: string } | null;
};

export default function TeacherSchedule() {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSchedules();
    }
  }, [user]);

  const fetchSchedules = async () => {
    try {
      const { data: teacherClasses, error: classesError } = await supabase
        .from('classes')
        .select('id')
        .eq('teacher_id', user?.id);

      if (classesError) throw classesError;

      const classIds = teacherClasses?.map((c) => c.id) || [];

      if (classIds.length === 0) {
        setSchedules([]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('class_schedules')
        .select('*, classes (name, description)')
        .in('class_id', classIds)
        .order('day_of_week', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar agenda');
    } finally {
      setLoading(false);
    }
  };

  const groupedSchedules = schedules.reduce((acc, schedule) => {
    const day = schedule.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(schedule);
    return acc;
  }, {} as Record<number, ClassSchedule[]>);

  if (loading) {
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
          <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
          <p className="text-muted-foreground">Seus horários de aula da semana</p>
        </div>

        <div className="grid gap-4">
          {[1, 2, 3, 4, 5, 6].map((day) => (
            <Card key={day}>
              <CardHeader>
                <CardTitle>{DAYS_OF_WEEK[day]}</CardTitle>
              </CardHeader>
              <CardContent>
                {groupedSchedules[day] && groupedSchedules[day].length > 0 ? (
                  <div className="space-y-3">
                    {groupedSchedules[day].map((schedule) => (
                      <div key={schedule.id} className="flex items-center justify-between p-3 border border-border rounded-lg bg-card">
                        <div>
                          <h4 className="font-semibold">{schedule.classes?.name}</h4>
                          {schedule.classes?.description && (
                            <p className="text-sm text-muted-foreground">{schedule.classes.description}</p>
                          )}
                        </div>
                        <div className="text-sm font-medium">
                          {schedule.start_time.substring(0, 5)} - {schedule.end_time.substring(0, 5)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">Nenhuma aula agendada</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

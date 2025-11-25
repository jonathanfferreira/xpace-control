import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/integrations/firebase/client';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
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
    if (!user) return;
    try {
      setLoading(true);
      // Get teacher's classes
      const classesQuery = query(collection(db, 'classes'), where('teacher_id', '==', user.id));
      const classesSnapshot = await getDocs(classesQuery);
      
      const classIds = classesSnapshot.docs.map(doc => doc.id);
      const classesMap = new Map();
      classesSnapshot.docs.forEach(doc => {
        classesMap.set(doc.id, doc.data());
      });

      if (classIds.length === 0) {
        setSchedules([]);
        return;
      }

      // Get schedules for those classes
      const schedulesQuery = query(
        collection(db, 'class_schedules'),
        where('class_id', 'in', classIds),
        orderBy('day_of_week'),
        orderBy('start_time')
      );
      const schedulesSnapshot = await getDocs(schedulesQuery);
      
      const schedulesData = schedulesSnapshot.docs.map(doc => {
        const schedule = doc.data();
        const classInfo = classesMap.get(schedule.class_id);
        return {
          id: doc.id,
          ...schedule,
          classes: classInfo ? { name: classInfo.name, description: classInfo.description } : null,
        } as ClassSchedule;
      });

      setSchedules(schedulesData);

    } catch (error: any) {
      console.error('Erro ao carregar agenda:', error);
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

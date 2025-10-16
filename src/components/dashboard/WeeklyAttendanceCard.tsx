import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { CalendarDays } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';

type ClassAttendance = {
  class_name: string;
  total_students: number;
  present_count: number;
  attendance_rate: number;
};

export function WeeklyAttendanceCard() {
  const { user } = useAuth();
  const [data, setData] = useState<ClassAttendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWeeklyAttendance();
    }
  }, [user]);

  const fetchWeeklyAttendance = async () => {
    try {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

      // Get user's school
      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('admin_id', user?.id)
        .single();

      if (!school) return;

      // Get all classes for the school
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .eq('school_id', school.id);

      if (!classes) return;

      // For each class, get enrollment count and attendance count
      const attendanceData: ClassAttendance[] = [];

      for (const classItem of classes) {
        // Get total enrolled students
        const { count: totalStudents } = await supabase
          .from('class_students')
          .select('*', { count: 'exact', head: true })
          .eq('class_id', classItem.id);

        // Get unique students who attended this week
        const { data: attendances } = await supabase
          .from('attendances')
          .select('student_id')
          .eq('class_id', classItem.id)
          .gte('attendance_date', format(weekStart, 'yyyy-MM-dd'))
          .lte('attendance_date', format(weekEnd, 'yyyy-MM-dd'));

        const uniqueStudents = new Set(attendances?.map(a => a.student_id) || []);
        const presentCount = uniqueStudents.size;
        const attendanceRate = totalStudents ? (presentCount / totalStudents) * 100 : 0;

        attendanceData.push({
          class_name: classItem.name,
          total_students: totalStudents || 0,
          present_count: presentCount,
          attendance_rate: Math.round(attendanceRate),
        });
      }

      setData(attendanceData);
    } catch (error) {
      console.error('Error fetching weekly attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Presenças da Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Presenças da Semana
        </CardTitle>
        <CardDescription>
          Métricas de presença por turma (semana atual)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Nenhuma presença registrada esta semana</p>
          ) : (
            data.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-semibold">{item.class_name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {item.present_count} de {item.total_students} alunos
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{item.attendance_rate}%</div>
                  <div className="text-xs text-muted-foreground">taxa de presença</div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { GuardianLayout } from '@/components/layout/GuardianLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Attendance {
  id: string;
  attendance_date: string;
  notes?: string;
  classes: {
    name: string;
  };
}

export default function GuardianAttendance() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendances();
  }, []);

  const fetchAttendances = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const studentId = params.get('student');
      
      if (!studentId) return;

      // Buscar nome do aluno
      const { data: studentData } = await supabase
        .from('students')
        .select('full_name')
        .eq('id', studentId)
        .single();

      if (studentData) setStudentName(studentData.full_name);

      // Buscar presenças
      const { data, error } = await supabase
        .from('attendances')
        .select(`
          id,
          attendance_date,
          notes,
          classes (
            name
          )
        `)
        .eq('student_id', studentId)
        .order('attendance_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setAttendances(data || []);
    } catch (error) {
      console.error('Error fetching attendances:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as presenças',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <GuardianLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </GuardianLayout>
    );
  }

  return (
    <GuardianLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Frequência</h1>
          <p className="text-muted-foreground">{studentName}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Histórico de Presenças
            </CardTitle>
            <CardDescription>
              {attendances.length} presenças registradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {attendances.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma presença registrada ainda.
              </p>
            ) : (
              <div className="space-y-4">
                {attendances.map((attendance) => (
                  <div 
                    key={attendance.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="rounded-full bg-green-500/10 p-2">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-foreground">
                        {attendance.classes?.name || 'Aula'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(attendance.attendance_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </div>
                      {attendance.notes && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          {attendance.notes}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </GuardianLayout>
  );
}

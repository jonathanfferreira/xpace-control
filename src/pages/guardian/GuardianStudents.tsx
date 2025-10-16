import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Calendar, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: string;
  full_name: string;
  photo_url?: string;
  active: boolean;
}

interface StudentPoints {
  total: number;
  achievements: number;
}

export default function GuardianStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [points, setPoints] = useState<Record<string, StudentPoints>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar guardian
      const { data: guardian } = await supabase
        .from('guardians')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!guardian) return;

      // Buscar alunos vinculados
      const { data: studentGuardians, error } = await supabase
        .from('student_guardians')
        .select(`
          student_id,
          students (
            id,
            full_name,
            photo_url,
            active
          )
        `)
        .eq('guardian_id', guardian.id);

      if (error) throw error;

      const studentsList = studentGuardians?.map(sg => sg.students).filter(Boolean) as Student[];
      setStudents(studentsList);

      // Buscar pontos de cada aluno
      for (const student of studentsList) {
        const { data: pointsData } = await supabase
          .from('student_points')
          .select('points')
          .eq('student_id', student.id);

        const { data: achievementsData } = await supabase
          .from('student_achievements')
          .select('id')
          .eq('student_id', student.id);

        setPoints(prev => ({
          ...prev,
          [student.id]: {
            total: pointsData?.reduce((sum, p) => sum + p.points, 0) || 0,
            achievements: achievementsData?.length || 0
          }
        }));
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os alunos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Meus Alunos</h1>
          <p className="text-muted-foreground">Acompanhe seus dependentes</p>
        </div>

        {students.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Nenhum aluno vinculado à sua conta ainda.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {students.map((student) => (
              <Card key={student.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={student.photo_url} alt={student.full_name} />
                      <AvatarFallback className="text-lg">
                        {student.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{student.full_name}</CardTitle>
                      <Badge variant={student.active ? 'default' : 'secondary'} className="mt-1">
                        {student.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Trophy className="h-4 w-4" />
                      <span>Pontos</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {points[student.id]?.total || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Trophy className="h-4 w-4 text-yellow-500" />
                      <span>Conquistas</span>
                    </div>
                    <span className="font-semibold text-foreground">
                      {points[student.id]?.achievements || 0}
                    </span>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <a 
                      href={`/guardian/attendance?student=${student.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      <Calendar className="h-4 w-4" />
                      Frequência
                    </a>
                    <a 
                      href={`/guardian/payments?student=${student.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
                    >
                      <DollarSign className="h-4 w-4" />
                      Pagamentos
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

import { GuardianLayout } from '@/components/layout/GuardianLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
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
  const { user } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [points, setPoints] = useState<Record<string, StudentPoints>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user]);

  const fetchStudents = async () => {
    if (!user) return;
    try {
      const guardiansQuery = query(collection(db, 'guardians'), where('user_id', '==', user.uid));
      const guardianSnapshot = await getDocs(guardiansQuery);

      if (guardianSnapshot.empty) {
        setLoading(false);
        return;
      }
      const guardianId = guardianSnapshot.docs[0].id;

      const studentGuardiansQuery = query(collection(db, 'student_guardians'), where('guardian_id', '==', guardianId));
      const studentGuardiansSnapshot = await getDocs(studentGuardiansQuery);

      if (studentGuardiansSnapshot.empty) {
        setLoading(false);
        return;
      }

      const studentPromises = studentGuardiansSnapshot.docs.map(async (sgDoc) => {
        const studentId = sgDoc.data().student_id;
        const studentDocRef = doc(db, 'students', studentId);
        const studentDoc = await getDoc(studentDocRef);
        return studentDoc.exists() ? { id: studentDoc.id, ...studentDoc.data() } as Student : null;
      });

      const studentsList = (await Promise.all(studentPromises)).filter(Boolean) as Student[];
      setStudents(studentsList);

      for (const student of studentsList) {
        const pointsQuery = query(collection(db, 'student_points'), where('student_id', '==', student.id));
        const pointsSnapshot = await getDocs(pointsQuery);
        const totalPoints = pointsSnapshot.docs.reduce((sum, doc) => sum + (doc.data().points || 0), 0);

        const achievementsQuery = query(collection(db, 'student_achievements'), where('student_id', '==', student.id));
        const achievementsSnapshot = await getDocs(achievementsQuery);
        const totalAchievements = achievementsSnapshot.size;

        setPoints(prev => ({
          ...prev,
          [student.id]: {
            total: totalPoints,
            achievements: totalAchievements
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
    </GuardianLayout>
  );
}

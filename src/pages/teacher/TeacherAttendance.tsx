import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import { CalendarIcon, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Attendance {
  id: string;
  student_id: string;
  class_id: string;
  attendance_date: string;
  marked_at: string;
  studentName?: string;
  className?: string;
}

interface ClassStudent {
  student_id: string;
  student_name: string;
}

interface TeacherClass {
    id: string;
    name: string;
}

export default function TeacherAttendance() {
  const { user } = useAuth();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [teacherClasses, setTeacherClasses] = useState<TeacherClass[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [classStudents, setClassStudents] = useState<ClassStudent[]>([]);

  useEffect(() => {
    if (user) {
      fetchTeacherClasses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClass) {
      fetchAttendances();
      getClassStudents();
    }
  }, [selectedClass, selectedDate]);

  const fetchTeacherClasses = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'classes'), where('teacher_id', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const classesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as TeacherClass[];
      setTeacherClasses(classesData);
      if (classesData.length > 0) {
        setSelectedClass(classesData[0].id);
      }
    } catch (error) {
      toast.error('Erro ao carregar turmas');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendances = async () => {
    if (!selectedClass) return;
    try {
      setLoading(true);
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const q = query(collection(db, 'attendances'), where('class_id', '==', selectedClass), where('attendance_date', '==', formattedDate));
      const querySnapshot = await getDocs(q);
      const attendancesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Attendance[];
      setAttendances(attendancesData);
    } catch (error) {
      toast.error('Erro ao carregar presenças');
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId: string) => {
    if (!user || !selectedClass) return;
    try {
      await addDoc(collection(db, 'attendances'), {
        student_id: studentId,
        class_id: selectedClass,
        attendance_date: format(selectedDate, 'yyyy-MM-dd'),
        marked_by: user.uid,
        marked_at: new Date().toISOString(),
      });
      toast.success('Presença marcada com sucesso');
      fetchAttendances(); // Refresh the list
    } catch (error) {
      toast.error('Erro ao marcar presença');
    }
  };

  const getClassStudents = async () => {
    if (!selectedClass) return;
    try {
        const q = query(collection(db, 'class_students'), where('class_id', '==', selectedClass));
        const querySnapshot = await getDocs(q);
        const studentPromises = querySnapshot.docs.map(async (docSnap) => {
            const studentId = docSnap.data().student_id;
            const studentDoc = await getDoc(doc(db, 'students', studentId));
            if(studentDoc.exists()){
                return { student_id: studentId, student_name: studentDoc.data().full_name };
            }
            return null;
        });

        const studentsData = (await Promise.all(studentPromises)).filter(Boolean) as ClassStudent[];
        setClassStudents(studentsData);
    } catch (error) {
        toast.error('Erro ao carregar alunos da turma');
    }
  };

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
            className="px-4 py-2 rounded-md border border-input bg-background"
          >
            {teacherClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant={'outline'} className={cn('justify-start text-left font-normal')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, 'dd/MM/yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} initialFocus />
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
                  <div key={cs.student_id} className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="font-medium">{cs.student_name}</span>
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
              {classStudents.length === 0 && !loading && (
                <p className="text-muted-foreground text-center py-4">Nenhum aluno matriculado nesta turma</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

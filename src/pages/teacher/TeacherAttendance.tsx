
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { collection, query, where, getDocs, addDoc, doc, getDoc, writeBatch } from 'firebase/firestore';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Loader2, Check, X, Megaphone, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type AttendanceStatus = 'present' | 'absent' | 'justified';

interface EnrolledStudent {
  id: string;
  name: string;
  attendanceStatus: AttendanceStatus | null;
}

export default function TeacherAttendance() {
  const { classId } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [classInfo, setClassInfo] = useState<any>(null);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  const fetchClassAndStudents = useCallback(async () => {
    if (!classId || !user) return;
    setLoading(true);
    try {
      // 1. Get Class Info
      const classRef = doc(db, 'classes', classId);
      const classSnap = await getDoc(classRef);
      if (!classSnap.exists() || classSnap.data().teacher_id !== user.uid) {
        toast.error("Turma não encontrada ou acesso negado.");
        navigate('/professor/turmas');
        return;
      }
      setClassInfo({ id: classSnap.id, ...classSnap.data() });

      // 2. Get Enrollments for the class
      const enrollmentsQuery = query(collection(db, 'enrollments'), where('class_id', '==', classId));
      const enrollmentsSnapshot = await getDocs(enrollmentsQuery);
      const studentIds = enrollmentsSnapshot.docs.map(d => d.data().student_id);

      // 3. Get Student Details
      let studentDetails: {id: string, name: string}[] = [];
      if(studentIds.length > 0) {
        const studentsQuery = query(collection(db, 'students'), where('__name__', 'in', studentIds));
        const studentsSnapshot = await getDocs(studentsQuery);
        studentDetails = studentsSnapshot.docs.map(d => ({ id: d.id, name: d.data().full_name }));
      }

      // 4. Check today's attendance for these students
      const attendanceQuery = query(collection(db, 'attendances'), 
        where('class_id', '==', classId), 
        where('attendance_date', '==', today)
      );
      const attendanceSnapshot = await getDocs(attendanceQuery);
      const todaysAttendances = new Map(attendanceSnapshot.docs.map(d => [d.data().student_id, d.data().status]));

      const studentList: EnrolledStudent[] = studentDetails.map(student => ({
        ...student,
        attendanceStatus: todaysAttendances.get(student.id) || null,
      }));

      setStudents(studentList);

    } catch (error: any) {
      toast.error("Erro ao carregar dados da turma:", { description: error.message });
    } finally {
      setLoading(false);
    }
  }, [classId, user, navigate, today]);

  useEffect(() => {
    fetchClassAndStudents();
  }, [fetchClassAndStudents]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === studentId ? { ...student, attendanceStatus: status } : student
      )
    );
  };

  const saveAttendance = async () => {
    if (!classId || !user) return;
    setSaving(true);
    try {
        const batch = writeBatch(db);
        
        const attendanceQuery = query(
            collection(db, 'attendances'), 
            where('class_id', '==', classId), 
            where('attendance_date', '==', today)
        );
        const attendanceSnapshot = await getDocs(attendanceQuery);
        const existingDocs = new Map(attendanceSnapshot.docs.map(d => [d.data().student_id, d.id]));

        students.forEach(student => {
            if (student.attendanceStatus) {
                const existingDocId = existingDocs.get(student.id);
                const data = {
                    class_id: classId,
                    student_id: student.id,
                    attendance_date: today,
                    status: student.attendanceStatus,
                    marked_by: user.uid,
                    marked_at: new Date()
                };

                if (existingDocId) {
                    const docRef = doc(db, 'attendances', existingDocId);
                    batch.update(docRef, data);
                } else {
                    const docRef = doc(collection(db, 'attendances'));
                    batch.set(docRef, data);
                }
            }
        });

        await batch.commit();
        toast.success("Lista de chamada salva com sucesso!");
        fetchClassAndStudents(); // Refresh data
    } catch (error: any) {
        toast.error("Erro ao salvar chamada:", { description: error.message });
    } finally {
        setSaving(false);
    }
  };
  
  if (loading) {
    return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-12 w-12 animate-spin" /></div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
         <Button variant="outline" size="sm" onClick={() => navigate('/professor/turmas')} className='mb-4'>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Minhas Turmas
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Lista de Chamada</CardTitle>
            <CardDescription>
              Turma <span className='font-semibold text-primary'>{classInfo?.name}</span> para o dia <span className='font-semibold text-primary'>{format(new Date(), 'dd/MM/yyyy')}</span>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {students.length > 0 ? students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                  <span className="font-medium">{student.name}</span>
                  <div className="flex items-center gap-2">
                    <Button 
                        size="sm"
                        variant={student.attendanceStatus === 'present' ? 'default' : 'outline'}
                        onClick={() => handleStatusChange(student.id, 'present')}
                        className='bg-green-600 hover:bg-green-700 text-white'
                    >
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button 
                        size="sm"
                        variant={student.attendanceStatus === 'absent' ? 'destructive' : 'outline'}
                        onClick={() => handleStatusChange(student.id, 'absent')}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    <Button 
                        size="sm"
                        variant={student.attendanceStatus === 'justified' ? 'secondary' : 'outline'}
                        onClick={() => handleStatusChange(student.id, 'justified')}
                    >
                        <Megaphone className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )) : (
                <p className="text-muted-foreground text-center py-4">Nenhum aluno matriculado nesta turma.</p>
              )}
            </div>
            <div className='flex justify-end mt-6'>
                <Button onClick={saveAttendance} disabled={saving || students.length === 0}>
                    {saving ? <Loader2 className='mr-2 h-4 w-4 animate-spin' /> : <CheckCircle className='mr-2 h-4 w-4'/>}
                    Salvar Chamada
                </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

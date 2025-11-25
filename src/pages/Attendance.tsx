
import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2, CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface AttendanceRecord {
  id: string;
  studentName: string;
  className: string;
  teacherName: string;
  status: 'present' | 'absent' | 'justified';
  attendance_date: string;
}

export default function AttendanceReport() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);

  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const schoolId = useMemo(async () => {
    if (!user) return null;
    const schoolQuery = query(collection(db, 'schools'), where('admin_id', '==', user.uid));
    const schoolSnapshot = await getDocs(schoolQuery);
    return schoolSnapshot.empty ? null : schoolSnapshot.docs[0].id;
  }, [user]);

  // Fetch initial data for filters
  useEffect(() => {
    const fetchFilterData = async () => {
      const resolvedSchoolId = await schoolId;
      if (!resolvedSchoolId) return;
      try {
        const [studentsSnap, classesSnap, usersSnap] = await Promise.all([
          getDocs(query(collection(db, 'students'), where('school_id', '==', resolvedSchoolId))),
          getDocs(query(collection(db, 'classes'), where('school_id', '==', resolvedSchoolId))),
          getDocs(query(collection(db, 'users')))
        ]);
        setStudents(studentsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setClasses(classesSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        setTeachers(usersSnap.docs.filter(d => d.data().role === 'teacher').map(d => ({ id: d.id, ...d.data() })));
      } catch (error) {
        toast.error("Erro ao carregar filtros");
      }
    };
    fetchFilterData();
  }, [schoolId]);

  // Fetch attendances based on filters
  useEffect(() => {
    const fetchAttendances = async () => {
      setLoading(true);
      try {
        let attendanceQuery = query(collection(db, 'attendances'), orderBy('attendance_date', 'desc'));
        
        if (selectedClass !== 'all') {
          attendanceQuery = query(attendanceQuery, where('class_id', '==', selectedClass));
        }
        if (selectedStudent !== 'all') {
          attendanceQuery = query(attendanceQuery, where('student_id', '==', selectedStudent));
        }
        if (dateRange?.from) {
            attendanceQuery = query(attendanceQuery, where('attendance_date', '>=', format(dateRange.from, 'yyyy-MM-dd')));
        }
        if (dateRange?.to) {
            attendanceQuery = query(attendanceQuery, where('attendance_date', '<=', format(dateRange.to, 'yyyy-MM-dd')));
        }
        
        const snapshot = await getDocs(attendanceQuery);
        const studentMap = new Map(students.map(s => [s.id, s.full_name]));
        const classMap = new Map(classes.map(c => [c.id, c.name]));
        const teacherMap = new Map(teachers.map(t => [t.id, t.displayName]));

        const records = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                studentName: studentMap.get(data.student_id) || 'Aluno não encontrado',
                className: classMap.get(data.class_id) || 'Turma não encontrada',
                teacherName: teacherMap.get(data.marked_by) || 'Professor não encontrado',
                status: data.status,
                attendance_date: data.attendance_date,
            }
        });
        setAttendances(records);
      } catch (error: any) {
        console.error(error);
        toast.error("Erro ao buscar presenças:", { description: error.message });
      } finally {
        setLoading(false);
      }
    };

    if (students.length > 0 && classes.length > 0) {
        fetchAttendances();
    }

  }, [selectedClass, selectedStudent, dateRange, students, classes, teachers]);

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'destructive';
      case 'justified': return 'secondary';
      default: return 'outline';
    }
  }
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'Presente';
      case 'absent': return 'Ausente';
      case 'justified': return 'Justificado';
      default: return 'N/A';
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Relatório de Frequência</h1>

        <Card>
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Filtre o relatório por turma, aluno ou período.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-4">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar por turma..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Turmas</SelectItem>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Filtrar por aluno..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Alunos</SelectItem>
                {students.map(s => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
              </SelectContent>
            </Select>

             <Popover>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className="w-[300px] justify-start text-left font-normal"
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                    dateRange.to ? (
                        <>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>
                    ) : (
                        format(dateRange.from, "LLL dd, y")
                    )
                    ) : (
                    <span>Escolha um período</span>
                    )}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ptBR}
                />
                </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Turma</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Marcado por</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="mx-auto my-4 h-8 w-8 animate-spin" /></TableCell></TableRow>
                ) : attendances.length > 0 ? (
                  attendances.map((att) => (
                    <TableRow key={att.id}>
                      <TableCell>{format(new Date(att.attendance_date), 'dd/MM/yyyy', { locale: ptBR })}</TableCell>
                      <TableCell className="font-medium">{att.studentName}</TableCell>
                      <TableCell>{att.className}</TableCell>
                      <TableCell><Badge variant={getStatusVariant(att.status)}>{getStatusLabel(att.status)}</Badge></TableCell>
                      <TableCell>{att.teacherName}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={5} className="text-center py-8">Nenhum registro encontrado para os filtros selecionados.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

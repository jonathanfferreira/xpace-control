import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, functions } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { httpsCallable } from "firebase/functions";
import { collection, query, where, getDocs, addDoc, doc, getDoc, orderBy, Timestamp } from "firebase/firestore";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Calendar, QrCode, Download } from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";

interface Attendance {
  id: string;
  marked_at: Timestamp;
  students?: { full_name: string };
  classes?: { name: string };
}

export default function Attendance() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isDemoMode } = useDemo();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [qrInput, setQrInput] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
    if(user){
      fetchAttendances();
    }
  }, [selectedDate, user, authLoading, navigate]);


  const fetchAttendances = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const attendanceQuery = query(
        collection(db, "attendances"),
        where("attendance_date", "==", selectedDate),
        orderBy("marked_at", "desc")
      );

      const querySnapshot = await getDocs(attendanceQuery);
      const attendanceData = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
        const attendance = docSnap.data();
        let studentName = 'Aluno não encontrado';
        let className = 'Turma não encontrada';

        if (attendance.student_id) {
          const studentDoc = await getDoc(doc(db, 'students', attendance.student_id));
          if (studentDoc.exists()) studentName = studentDoc.data().full_name;
        }
        if (attendance.class_id) {
          const classDoc = await getDoc(doc(db, 'classes', attendance.class_id));
          if (classDoc.exists()) className = classDoc.data().name;
        }
        
        return {
          id: docSnap.id,
          ...attendance,
          students: { full_name: studentName },
          classes: { name: className },
        } as Attendance;
      }));

      setAttendances(attendanceData);
    } catch (error: any) {
      console.error(error);
      toast.error("Erro ao carregar presenças");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    if (!user) return;
    try {
      const classesQuery = query(collection(db, "classes"), where("qr_code", "==", qrInput.trim()));
      const classSnapshot = await getDocs(classesQuery);

      if (classSnapshot.empty) {
        toast.error("QR Code inválido");
        return;
      }
      const classData = classSnapshot.docs[0];

      // This logic is based on the original implementation, assuming a parent user is marking attendance.
      const studentsQuery = query(collection(db, "students"), where("parent_id", "==", user.uid));
      const studentSnapshot = await getDocs(studentsQuery);

      if (studentSnapshot.empty) {
        toast.error("Nenhum aluno vinculado a este usuário foi encontrado.");
        return;
      }
      const studentData = studentSnapshot.docs[0]; // Taking the first student found

      await addDoc(collection(db, "attendances"), {
        class_id: classData.id,
        student_id: studentData.id,
        attendance_date: selectedDate,
        marked_by: user.uid,
        marked_at: new Date(),
      });

      toast.success("Presença marcada com sucesso!");
      setIsQRDialogOpen(false);
      setQrInput("");
      fetchAttendances();
    } catch (error: any) {
      toast.error(error.message || "Erro ao marcar presença");
    }
  };

  const handleExport = async () => {
    if (isDemoMode) {
      toast.success("Relatório exportado! (demo)");
      return;
    }

    setExporting(true);
    try {
      const exportReportFunc = httpsCallable(functions, 'exportReport');
      const result: any = await exportReportFunc({ reportType: 'attendances', filters: { date: selectedDate } });
      
      const blob = new Blob([result.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio_presencas_${selectedDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      console.error(error)
      toast.error("Erro ao exportar relatório");
    } finally {
      setExporting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Presenças</h1>
            <p className="text-muted-foreground">Gerencie a presença dos alunos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={exporting}><Download className="h-4 w-4 mr-2" />{exporting ? "Exportando..." : "Exportar CSV"}</Button>
            <Button onClick={() => setIsQRDialogOpen(true)}><QrCode className="h-4 w-4 mr-2" />Marcar Presença</Button>
          </div>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Selecionar Data</CardTitle></CardHeader>
          <CardContent><Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="max-w-xs" /></CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Presenças do Dia</CardTitle></CardHeader>
          <CardContent>
            {attendances.length > 0 ? (
              <div className="space-y-3">
                {attendances.map((attendance) => (
                  <div key={attendance.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{attendance.students?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{attendance.classes?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {attendance.marked_at ? attendance.marked_at.toDate().toLocaleTimeString("pt-BR") : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhuma presença registrada nesta data</p>
            )}
          </CardContent>
        </Card>

        <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Marcar Presença via QR Code</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Digite ou escaneie o código QR da turma</p>
              <Input value={qrInput} onChange={(e) => setQrInput(e.target.value)} placeholder="Cole o código aqui" />
              <Button onClick={handleMarkAttendance} className="w-full">Confirmar Presença</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

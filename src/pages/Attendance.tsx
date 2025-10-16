import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Calendar, QrCode, Download } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { useDemo } from "@/contexts/DemoContext";

type Attendance = Database["public"]["Tables"]["attendances"]["Row"] & {
  students?: { full_name: string };
  classes?: { name: string };
};

export default function Attendance() {
  const navigate = useNavigate();
  const { isDemoMode } = useDemo();
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isQRDialogOpen, setIsQRDialogOpen] = useState(false);
  const [qrInput, setQrInput] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    checkAuth();
    fetchAttendances();
  }, [selectedDate]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const fetchAttendances = async () => {
    try {
      const { data, error } = await supabase
        .from("attendances")
        .select(`
          *,
          students(full_name),
          classes(name)
        `)
        .eq("attendance_date", selectedDate)
        .order("marked_at", { ascending: false });

      if (error) throw error;
      setAttendances(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar presenças");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find class by QR code
      const { data: classData, error: classError } = await supabase
        .from("classes")
        .select("id")
        .eq("qr_code", qrInput.trim())
        .single();

      if (classError || !classData) {
        toast.error("QR Code inválido");
        return;
      }

      // Get first student of user (simplified for MVP)
      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .eq("parent_id", user.id)
        .limit(1)
        .single();

      if (!studentData) {
        toast.error("Nenhum aluno encontrado");
        return;
      }

      const { error } = await supabase.from("attendances").insert({
        class_id: classData.id,
        student_id: studentData.id,
        attendance_date: selectedDate,
        marked_by: user.id,
      });

      if (error) throw error;

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
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-report`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reportType: "attendances" }),
        }
      );

      if (!response.ok) throw new Error("Erro ao exportar");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio_presencas_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Relatório exportado com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar relatório");
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Presenças</h1>
            <p className="text-muted-foreground">Gerencie a presença dos alunos</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} disabled={exporting}>
              <Download className="h-4 w-4 mr-2" />
              {exporting ? "Exportando..." : "Exportar CSV"}
            </Button>
            <Button className="gradient-xpace" onClick={() => setIsQRDialogOpen(true)}>
              <QrCode className="h-4 w-4 mr-2" />
              Marcar Presença
            </Button>
          </div>
        </div>

        {/* Date Selector */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Selecionar Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="max-w-xs"
            />
          </CardContent>
        </Card>

        {/* Attendances List */}
        <Card>
          <CardHeader>
            <CardTitle>Presenças do Dia</CardTitle>
          </CardHeader>
          <CardContent>
            {attendances.length > 0 ? (
              <div className="space-y-3">
                {attendances.map((attendance) => (
                  <div
                    key={attendance.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{attendance.students?.full_name}</p>
                      <p className="text-sm text-muted-foreground">{attendance.classes?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(attendance.marked_at).toLocaleTimeString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma presença registrada nesta data
              </p>
            )}
          </CardContent>
        </Card>

        {/* QR Scanner Dialog */}
        <Dialog open={isQRDialogOpen} onOpenChange={setIsQRDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Marcar Presença via QR Code</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Digite ou escaneie o código QR da turma
              </p>
              <Input
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="Cole o código aqui"
              />
              <Button onClick={handleMarkAttendance} className="w-full gradient-xpace">
                Confirmar Presença
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

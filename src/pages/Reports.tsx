import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { FileText, Download, FileSpreadsheet, Calendar } from "lucide-react";
import { format } from "date-fns";

type ReportType = "attendance" | "payments" | "enrollments";

export default function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("attendance");
  const [startDate, setStartDate] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    fetchClasses();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const fetchClasses = async () => {
    try {
      const { data } = await supabase
        .from("classes")
        .select("id, name")
        .eq("active", true)
        .order("name");

      setClasses(data || []);
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const generateCSV = async () => {
    setLoading(true);
    try {
      let data: any[] = [];
      let headers: string[] = [];
      let filename = "";

      if (reportType === "attendance") {
        const query = supabase
          .from("attendances")
          .select(`
            attendance_date,
            students(full_name),
            classes(name)
          `)
          .gte("attendance_date", startDate)
          .lte("attendance_date", endDate);

        if (selectedClass !== "all") {
          query.eq("class_id", selectedClass);
        }

        const { data: attendances } = await query;
        data = attendances || [];
        headers = ["Data", "Aluno", "Turma"];
        filename = `presencas_${startDate}_${endDate}.csv`;

        const csv = [
          headers.join(","),
          ...data.map((row) =>
            [
              row.attendance_date,
              row.students?.full_name || "-",
              row.classes?.name || "-",
            ].join(",")
          ),
        ].join("\n");

        downloadFile(csv, filename, "text/csv");
      } else if (reportType === "payments") {
        const query = supabase
          .from("payments")
          .select(`
            due_date,
            amount,
            status,
            students(full_name)
          `)
          .gte("due_date", startDate)
          .lte("due_date", endDate);

        const { data: payments } = await query;
        data = payments || [];
        headers = ["Vencimento", "Aluno", "Valor", "Status"];
        filename = `pagamentos_${startDate}_${endDate}.csv`;

        const csv = [
          headers.join(","),
          ...data.map((row) =>
            [
              row.due_date,
              row.students?.full_name || "-",
              row.amount,
              row.status,
            ].join(",")
          ),
        ].join("\n");

        downloadFile(csv, filename, "text/csv");
      } else if (reportType === "enrollments") {
        const query = supabase
          .from("enrollments")
          .select(`
            start_date,
            status,
            students(full_name),
            classes(name)
          `)
          .gte("start_date", startDate)
          .lte("start_date", endDate);

        const { data: enrollments } = await query;
        data = enrollments || [];
        headers = ["Data Matrícula", "Aluno", "Turma", "Status"];
        filename = `matriculas_${startDate}_${endDate}.csv`;

        const csv = [
          headers.join(","),
          ...data.map((row) =>
            [
              row.start_date,
              row.students?.full_name || "-",
              row.classes?.name || "-",
              row.status,
            ].join(",")
          ),
        ].join("\n");

        downloadFile(csv, filename, "text/csv");
      }

      toast.success("CSV gerado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao gerar CSV: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: schoolData } = await supabase
        .from("schools")
        .select("*")
        .eq("admin_id", user.id)
        .single();

      const { data, error } = await supabase.functions.invoke("export-report", {
        body: {
          reportType,
          startDate,
          endDate,
          classId: selectedClass !== "all" ? selectedClass : null,
          schoolName: schoolData?.name || "Escola",
          schoolColor: schoolData?.primary_color || "#6324b2",
        },
      });

      if (error) throw error;

      if (data?.pdf) {
        // Convert base64 to blob and download
        const byteCharacters = atob(data.pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `relatorio_${reportType}_${startDate}_${endDate}.pdf`;
        a.click();
        URL.revokeObjectURL(url);

        toast.success("PDF gerado com sucesso!");
      }
    } catch (error: any) {
      toast.error("Erro ao gerar PDF: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground">Gere relatórios e exporte dados</p>
        </div>

        <Tabs value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="attendance">Presenças</TabsTrigger>
            <TabsTrigger value="payments">Pagamentos</TabsTrigger>
            <TabsTrigger value="enrollments">Matrículas</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatório de Presenças</CardTitle>
                <CardDescription>
                  Exporte dados de presenças por período e turma
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data Início</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Data Fim</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Turma</Label>
                  <Select value={selectedClass} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as turmas</SelectItem>
                      {classes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={generateCSV}
                    disabled={loading}
                    variant="outline"
                    className="flex-1"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                  <Button
                    onClick={generatePDF}
                    disabled={loading}
                    className="flex-1 gradient-xpace"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatório de Inadimplência</CardTitle>
                <CardDescription>
                  Exporte dados de pagamentos em aberto e atrasados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data Início</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Data Fim</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={generateCSV}
                    disabled={loading}
                    variant="outline"
                    className="flex-1"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                  <Button
                    onClick={generatePDF}
                    disabled={loading}
                    className="flex-1 gradient-xpace"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enrollments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Evolução de Matrículas</CardTitle>
                <CardDescription>
                  Exporte dados de matrículas por período
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Data Início</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Data Fim</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={generateCSV}
                    disabled={loading}
                    variant="outline"
                    className="flex-1"
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Exportar CSV
                  </Button>
                  <Button
                    onClick={generatePDF}
                    disabled={loading}
                    className="flex-1 gradient-xpace"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Gerar PDF
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

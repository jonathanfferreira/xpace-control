import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { FileText, Download, FileSpreadsheet, Calendar, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import Papa from "papaparse";
import { ReportSummary } from "@/components/reports/ReportSummary";

type ReportType = "attendance" | "payments" | "enrollments";

export default function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<ReportType>("attendance");
  const [startDate, setStartDate] = useState(format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [reportData, setReportData] = useState<any[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchClasses();
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [reportType, startDate, endDate, selectedClass, selectedStudent]);

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

  const fetchStudents = async () => {
    try {
      const { data } = await supabase
        .from("students")
        .select("id, full_name")
        .eq("active", true)
        .order("full_name");

      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchReportData = async () => {
    setDataLoading(true);
    try {
      if (reportType === "attendance") {
        let query = supabase
          .from("attendances")
          .select(`
            id,
            attendance_date,
            marked_at,
            students(full_name),
            classes(name)
          `)
          .gte("attendance_date", startDate)
          .lte("attendance_date", endDate)
          .order("attendance_date", { ascending: false });

        if (selectedClass !== "all") query = query.eq("class_id", selectedClass);
        if (selectedStudent !== "all") query = query.eq("student_id", selectedStudent);

        const { data } = await query;
        setReportData(data || []);
      } else if (reportType === "payments") {
        let query = supabase
          .from("payments")
          .select(`
            id,
            due_date,
            amount,
            status,
            paid_date,
            students(full_name)
          `)
          .gte("due_date", startDate)
          .lte("due_date", endDate)
          .order("due_date", { ascending: false });

        if (selectedStudent !== "all") query = query.eq("student_id", selectedStudent);

        const { data } = await query;
        setReportData(data || []);
      } else if (reportType === "enrollments") {
        let query = supabase
          .from("enrollments")
          .select(`
            id,
            start_date,
            status,
            students(full_name),
            classes(name)
          `)
          .gte("start_date", startDate)
          .lte("start_date", endDate)
          .order("start_date", { ascending: false });

        if (selectedClass !== "all") query = query.eq("class_id", selectedClass);
        if (selectedStudent !== "all") query = query.eq("student_id", selectedStudent);

        const { data } = await query;
        setReportData(data || []);
      }
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setDataLoading(false);
    }
  };

  const generateCSV = () => {
    try {
      let csvData: any[] = [];
      let filename = "";

      if (reportType === "attendance") {
        csvData = reportData.map((row) => ({
          "Data": format(new Date(row.attendance_date), "dd/MM/yyyy"),
          "Aluno": row.students?.full_name || "-",
          "Turma": row.classes?.name || "-",
          "Horário": format(new Date(row.marked_at), "HH:mm"),
        }));
        filename = `presencas_${startDate}_${endDate}.csv`;
      } else if (reportType === "payments") {
        csvData = reportData.map((row) => ({
          "Aluno": row.students?.full_name || "-",
          "Valor": `R$ ${Number(row.amount).toFixed(2)}`,
          "Vencimento": format(new Date(row.due_date), "dd/MM/yyyy"),
          "Status": row.status === "paid" ? "Pago" : "Pendente",
          "Data Pagamento": row.paid_date ? format(new Date(row.paid_date), "dd/MM/yyyy") : "-",
        }));
        filename = `pagamentos_${startDate}_${endDate}.csv`;
      } else if (reportType === "enrollments") {
        csvData = reportData.map((row) => ({
          "Data Matrícula": format(new Date(row.start_date), "dd/MM/yyyy"),
          "Aluno": row.students?.full_name || "-",
          "Turma": row.classes?.name || "-",
          "Status": row.status,
        }));
        filename = `matriculas_${startDate}_${endDate}.csv`;
      }

      const csv = Papa.unparse(csvData);
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("CSV gerado com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao gerar CSV: " + error.message);
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
          studentId: selectedStudent !== "all" ? selectedStudent : null,
          schoolName: schoolData?.name || "Escola",
          schoolColor: schoolData?.primary_color || "#6324b2",
        },
      });

      if (error) throw error;

      if (data?.pdf) {
        // The edge function returns HTML as base64
        // Convert it to a blob and open in a new window to print/save as PDF
        const byteCharacters = atob(data.pdf);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "text/html;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        
        // Open in new window so user can print to PDF
        const printWindow = window.open(url, "_blank");
        if (printWindow) {
          printWindow.onload = () => {
            setTimeout(() => {
              printWindow.print();
            }, 250);
          };
        }
        
        toast.success("Relatório gerado! Use Ctrl+P ou Cmd+P para salvar como PDF");
      }
    } catch (error: any) {
      console.error("Error generating PDF:", error);
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
    <>
      <Helmet>
        <title>Relatórios - XPACE Control</title>
        <meta name="description" content="Gere relatórios de presenças, pagamentos e matrículas com filtros avançados. Exporte para CSV ou PDF." />
      </Helmet>
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
                <ReportSummary reportType={reportType} data={reportData} />
                
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

                <div>
                  <Label>Aluno</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os alunos</SelectItem>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Data Preview */}
                <div className="rounded-md border mt-6">
                  <div className="p-4 bg-muted/50 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Visualização dos Dados</h3>
                      <p className="text-sm text-muted-foreground">
                        {reportData.length} registro{reportData.length !== 1 ? "s" : ""} encontrado{reportData.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={fetchReportData}
                      disabled={dataLoading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${dataLoading ? "animate-spin" : ""}`} />
                      Atualizar
                    </Button>
                  </div>
                  <div className="max-h-[400px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Turma</TableHead>
                          <TableHead>Horário</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dataLoading ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              Carregando...
                            </TableCell>
                          </TableRow>
                        ) : reportData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              Nenhum registro encontrado no período selecionado
                            </TableCell>
                          </TableRow>
                        ) : (
                          reportData.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell>{format(new Date(row.attendance_date), "dd/MM/yyyy")}</TableCell>
                              <TableCell>{row.students?.full_name || "-"}</TableCell>
                              <TableCell>{row.classes?.name || "-"}</TableCell>
                              <TableCell>{format(new Date(row.marked_at), "HH:mm")}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
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

          <TabsContent value="payments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatório de Inadimplência</CardTitle>
                <CardDescription>
                  Exporte dados de pagamentos em aberto e atrasados
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ReportSummary reportType={reportType} data={reportData} />
                
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
                  <Label>Aluno</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os alunos</SelectItem>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Data Preview */}
                <div className="rounded-md border mt-6">
                  <div className="p-4 bg-muted/50 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Visualização dos Dados</h3>
                      <p className="text-sm text-muted-foreground">
                        {reportData.length} registro{reportData.length !== 1 ? "s" : ""} encontrado{reportData.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={fetchReportData}
                      disabled={dataLoading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${dataLoading ? "animate-spin" : ""}`} />
                      Atualizar
                    </Button>
                  </div>
                  <div className="max-h-[400px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dataLoading ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              Carregando...
                            </TableCell>
                          </TableRow>
                        ) : reportData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              Nenhum registro encontrado no período selecionado
                            </TableCell>
                          </TableRow>
                        ) : (
                          reportData.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell>{row.students?.full_name || "-"}</TableCell>
                              <TableCell>R$ {Number(row.amount).toFixed(2)}</TableCell>
                              <TableCell>{format(new Date(row.due_date), "dd/MM/yyyy")}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  row.status === "paid" 
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                                    : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                                }`}>
                                  {row.status === "paid" ? "Pago" : "Pendente"}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
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
                <ReportSummary reportType={reportType} data={reportData} />
                
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
                  <Label>Aluno</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os alunos</SelectItem>
                      {students.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Data Preview */}
                <div className="rounded-md border mt-6">
                  <div className="p-4 bg-muted/50 flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Visualização dos Dados</h3>
                      <p className="text-sm text-muted-foreground">
                        {reportData.length} registro{reportData.length !== 1 ? "s" : ""} encontrado{reportData.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={fetchReportData}
                      disabled={dataLoading}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${dataLoading ? "animate-spin" : ""}`} />
                      Atualizar
                    </Button>
                  </div>
                  <div className="max-h-[400px] overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data Matrícula</TableHead>
                          <TableHead>Aluno</TableHead>
                          <TableHead>Turma</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dataLoading ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              Carregando...
                            </TableCell>
                          </TableRow>
                        ) : reportData.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                              Nenhum registro encontrado no período selecionado
                            </TableCell>
                          </TableRow>
                        ) : (
                          reportData.map((row) => (
                            <TableRow key={row.id}>
                              <TableCell>{format(new Date(row.start_date), "dd/MM/yyyy")}</TableCell>
                              <TableCell>{row.students?.full_name || "-"}</TableCell>
                              <TableCell>{row.classes?.name || "-"}</TableCell>
                              <TableCell>
                                <span className={`px-2 py-1 rounded-full text-xs ${
                                  row.status === "active" 
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                                    : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                                }`}>
                                  {row.status}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
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
    </>
  );
}

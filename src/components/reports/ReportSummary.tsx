import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, DollarSign } from "lucide-react";

interface ReportSummaryProps {
  reportType: "attendance" | "payments" | "enrollments";
  data: any[];
}

export function ReportSummary({ reportType, data }: ReportSummaryProps) {
  if (reportType === "attendance") {
    const totalAttendances = data.length;
    const uniqueStudents = new Set(data.map(d => d.students?.full_name)).size;
    const uniqueClasses = new Set(data.map(d => d.classes?.name)).size;

    return (
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Presenças</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAttendances}</div>
            <p className="text-xs text-muted-foreground">
              {uniqueStudents} aluno{uniqueStudents !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Turmas</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueClasses}</div>
            <p className="text-xs text-muted-foreground">
              turma{uniqueClasses !== 1 ? "s" : ""} ativa{uniqueClasses !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Média por Aluno</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {uniqueStudents > 0 ? (totalAttendances / uniqueStudents).toFixed(1) : "0"}
            </div>
            <p className="text-xs text-muted-foreground">presenças/aluno</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (reportType === "payments") {
    const totalAmount = data.reduce((sum, d) => sum + Number(d.amount), 0);
    const paidCount = data.filter(d => d.status === "paid").length;
    const pendingCount = data.filter(d => d.status === "pending").length;
    const paidAmount = data.filter(d => d.status === "paid").reduce((sum, d) => sum + Number(d.amount), 0);

    return (
      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalAmount)}
            </div>
            <p className="text-xs text-muted-foreground">{data.length} pagamentos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recebido</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(paidAmount)}
            </div>
            <p className="text-xs text-muted-foreground">{paidCount} pagos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <TrendingDown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalAmount - paidAmount)}
            </div>
            <p className="text-xs text-muted-foreground">{pendingCount} pendentes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Pagamento</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.length > 0 ? Math.round((paidCount / data.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">pagamentos realizados</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (reportType === "enrollments") {
    const totalEnrollments = data.length;
    const activeEnrollments = data.filter(d => d.status === "active").length;
    const uniqueClasses = new Set(data.map(d => d.classes?.name)).size;

    return (
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Matrículas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEnrollments}</div>
            <p className="text-xs text-muted-foreground">no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Matrículas Ativas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeEnrollments}</div>
            <p className="text-xs text-muted-foreground">
              {totalEnrollments > 0 ? Math.round((activeEnrollments / totalEnrollments) * 100) : 0}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Turmas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueClasses}</div>
            <p className="text-xs text-muted-foreground">
              turma{uniqueClasses !== 1 ? "s" : ""} com matrícula{totalEnrollments !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

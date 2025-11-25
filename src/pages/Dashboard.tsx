
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, School, DollarSign, Calendar as CalendarIcon } from "lucide-react";
import { OverviewChart } from "@/components/dashboard/OverviewChart";
import { RecentEvents } from "@/components/dashboard/RecentEvents";
import { useStudents } from "@/hooks/useStudents";
import { useClasses } from "@/hooks/useClasses";
import { useMemo } from "react";

export default function Dashboard() {
  const { user } = useAuth();
  const { students } = useStudents();
  const { classes } = useClasses();

  const activeStudentsCount = useMemo(() => {
    return students.filter(s => s.status === 'ativo').length;
  }, [students]);

  const totalClassesCount = useMemo(() => {
    return classes.length;
  }, [classes]);

  // Mock da receita mensal por enquanto
  const monthlyRevenue = 5423.45;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bem-vindo, {user?.displayName}!</h1>
          <p className="text-muted-foreground">
            Aqui está um resumo da sua escola.
          </p>
        </div>
      </div>

      {/* === Cards de KPIs === */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeStudentsCount}</div>
            <p className="text-xs text-muted-foreground">Total de alunos matriculados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Turmas Ativas</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClassesCount}</div>
            <p className="text-xs text-muted-foreground">Total de turmas na escola</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita do Mês</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {monthlyRevenue.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">(Receita bruta simulada)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximos Eventos</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             {/* A contagem virá do componente RecentEvents */}
            <div className="text-2xl font-bold">+3</div>
            <p className="text-xs text-muted-foreground">Eventos nesta semana</p>
          </CardContent>
        </Card>
      </div>

      {/* === Gráficos e Listas === */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
        <Card className="col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Visão Geral</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart />
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Próximos Eventos</CardTitle>
          </CardHeader>
          <CardContent>
            <RecentEvents />
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

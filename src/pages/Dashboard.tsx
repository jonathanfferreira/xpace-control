
import {
  Card,  CardContent,  CardDescription,  CardHeader,  CardTitle,
} from "@/components/ui/card";
import {
  Table,  TableBody,  TableCell,  TableHead,  TableHeader,  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, Activity, UserCheck } from "lucide-react";

// Dados de exemplo
const metrics = {
  totalStudents: 152,
  activeStudents: 140,
  monthlyRevenue: 25200,
  overdueStudents: 15,
};

const recentActivities = [
  { student: "Juliana Martins", type: "Pagamento Recebido", amount: "+ R$180.00" },
  { student: "Carlos Silva", type: "Matrícula Nova", class: "Hip Hop - Iniciante" },
  { student: "Fernanda Lima", type: "Cobrança Gerada", amount: "R$220.00" },
  { student: "Lucas Souza", type: "Aula Experimental", class: "Dança de Salão" },
  { student: "Mariana Costa", type: "Pagamento Atrasado", amount: "- R$150.00" },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      
      {/* Grid de Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Alunos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Todos os alunos registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alunos Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeStudents}</div>
            <p className="text-xs text-muted-foreground">+5.2% desde o mês passado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita (Este Mês)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {metrics.monthlyRevenue.toLocaleString('pt-BR')}</div>
            <p className="text-xs text-muted-foreground">Previsto vs. Realizado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inadimplentes</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.overdueStudents}</div>
            <p className="text-xs text-muted-foreground">Totalizando R$ 2,750.00</p>
          </CardContent>
        </Card>
      </div>

      {/* Atividade Recente */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Acompanhe as últimas movimentações na sua escola.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Detalhe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivities.map((activity, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{activity.student}</TableCell>
                  <TableCell>
                      <Badge variant="outline">{activity.type}</Badge>
                  </TableCell>
                  <TableCell className={`text-right ${activity.amount?.includes('+') ? 'text-green-500' : activity.amount?.includes('-') ? 'text-red-500' : ''}`}>
                      {activity.amount || activity.class}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

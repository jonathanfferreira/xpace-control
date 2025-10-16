import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, CheckSquare, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    attendancesLast7Days: 0,
  });

  useEffect(() => {
    checkAuth();
    fetchStats();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const fetchStats = async () => {
    try {
      // Get total students
      const { count: studentsCount } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true });

      // Get total classes
      const { count: classesCount } = await supabase
        .from("classes")
        .select("*", { count: "exact", head: true });

      // Get attendances from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const { count: attendancesCount } = await supabase
        .from("attendances")
        .select("*", { count: "exact", head: true })
        .gte("attendance_date", sevenDaysAgo.toISOString().split("T")[0]);

      setStats({
        totalStudents: studentsCount || 0,
        totalClasses: classesCount || 0,
        attendancesLast7Days: attendancesCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  const statCards = [
    {
      title: "Total de Alunos",
      value: stats.totalStudents,
      icon: Users,
      description: "Alunos cadastrados",
      color: "text-blue-600",
    },
    {
      title: "Total de Turmas",
      value: stats.totalClasses,
      icon: GraduationCap,
      description: "Turmas ativas",
      color: "text-purple-600",
    },
    {
      title: "Presenças (7 dias)",
      value: stats.attendancesLast7Days,
      icon: CheckSquare,
      description: "Últimos 7 dias",
      color: "text-green-600",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao Xpace Control. Visão geral da sua escola.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="gradient-xpace text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Próximas Funcionalidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/90">
              Em breve: Relatórios detalhados, mensagens automáticas, gestão de eventos e muito mais!
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

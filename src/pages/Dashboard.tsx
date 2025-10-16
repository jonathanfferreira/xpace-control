import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, CheckSquare, TrendingUp, DollarSign } from "lucide-react";
import { useDemo } from "@/contexts/DemoContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const navigate = useNavigate();
  const { isDemoMode, demoData } = useDemo();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    attendancesLast7Days: 0,
    averageAttendanceRate: 0,
    estimatedRevenue: 0,
  });
  const [weeklyAttendanceData, setWeeklyAttendanceData] = useState<Array<{ day: string; presenças: number }>>([]);

  useEffect(() => {
    if (isDemoMode) {
      // Use demo data with calculated metrics
      const totalAttendances = demoData.attendances.length;
      const totalPossibleAttendances = demoData.students.length * demoData.classes.length * 7; // rough estimate
      const avgRate = Math.round((totalAttendances / totalPossibleAttendances) * 100);
      
      const totalRevenue = demoData.payments.reduce((sum, p) => sum + (p.status === 'paid' ? p.amount : 0), 0);

      // Generate weekly data
      const weekData = [
        { day: "Seg", presenças: 5 },
        { day: "Ter", presenças: 4 },
        { day: "Qua", presenças: 6 },
        { day: "Qui", presenças: 3 },
        { day: "Sex", presenças: 8 },
        { day: "Sáb", presenças: 2 },
        { day: "Dom", presenças: 0 },
      ];

      setStats({
        totalStudents: demoData.students.length,
        totalClasses: demoData.classes.length,
        attendancesLast7Days: demoData.attendances.length,
        averageAttendanceRate: avgRate,
        estimatedRevenue: totalRevenue,
      });
      setWeeklyAttendanceData(weekData);
      setLoading(false);
    } else {
      checkAuth();
      fetchStats();
    }
  }, [isDemoMode]);

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
      const { count: attendancesCount, data: attendancesData } = await supabase
        .from("attendances")
        .select("*", { count: "exact" })
        .gte("attendance_date", sevenDaysAgo.toISOString().split("T")[0]);

      // Calculate average attendance rate
      const totalPossibleAttendances = (studentsCount || 0) * (classesCount || 0) * 7;
      const avgRate = totalPossibleAttendances > 0 
        ? Math.round(((attendancesCount || 0) / totalPossibleAttendances) * 100)
        : 0;

      // Get payments data for estimated revenue
      const { data: paymentsData } = await supabase
        .from("payments")
        .select("amount, status")
        .eq("status", "paid");

      const totalRevenue = paymentsData?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Generate weekly attendance data
      const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
      const weekData = weekDays.map((day, index) => {
        const dayDate = new Date();
        dayDate.setDate(dayDate.getDate() - (6 - index));
        const dayAttendances = attendancesData?.filter(
          (a) => new Date(a.attendance_date).getDay() === index
        ).length || 0;
        return { day, presenças: dayAttendances };
      });

      setStats({
        totalStudents: studentsCount || 0,
        totalClasses: classesCount || 0,
        attendancesLast7Days: attendancesCount || 0,
        averageAttendanceRate: avgRate,
        estimatedRevenue: totalRevenue,
      });
      setWeeklyAttendanceData(weekData);
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
    {
      title: "Taxa de Presença",
      value: `${stats.averageAttendanceRate}%`,
      icon: TrendingUp,
      description: "Média semanal",
      color: "text-orange-600",
    },
    {
      title: "Faturamento",
      value: `R$ ${stats.estimatedRevenue.toFixed(2)}`,
      icon: DollarSign,
      description: "Pagamentos confirmados",
      color: "text-emerald-600",
    },
  ];

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Analytics e métricas da sua escola de dança
          </p>
        </div>

        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
                  <div className="text-2xl md:text-3xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Weekly Attendance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Presenças Semanais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyAttendanceData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="presenças" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

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

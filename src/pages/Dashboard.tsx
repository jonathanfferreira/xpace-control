import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, Calendar, TrendingUp } from "lucide-react";
import xpaceLogo from "@/assets/xpace-logo.png";
import type { User } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total de Alunos",
      value: "0",
      icon: Users,
      description: "Nenhum aluno cadastrado ainda",
    },
    {
      title: "Turmas Ativas",
      value: "0",
      icon: GraduationCap,
      description: "Nenhuma turma criada",
    },
    {
      title: "Aulas Esta Semana",
      value: "0",
      icon: Calendar,
      description: "Nenhuma aula agendada",
    },
    {
      title: "Taxa de Presença",
      value: "0%",
      icon: TrendingUp,
      description: "Sem dados de presença",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={xpaceLogo} alt="Xpace Control" className="h-10 w-auto" />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user?.user_metadata?.full_name || user?.email}
            </span>
            <Button variant="outline" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo ao painel de controle da sua escola
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-1">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Welcome Message */}
        <Card className="gradient-xpace text-white">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-4">
              Bem-vindo ao Xpace Control! 🎉
            </h2>
            <p className="mb-4 text-white/90">
              Este é o início da sua jornada com a plataforma. Em breve você poderá:
            </p>
            <ul className="space-y-2 mb-6 text-white/90">
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-white/60"></div>
                Cadastrar alunos e responsáveis
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-white/60"></div>
                Criar e gerenciar turmas
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-white/60"></div>
                Marcar presenças via QR Code
              </li>
              <li className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-white/60"></div>
                Controlar pagamentos e mensalidades
              </li>
            </ul>
            <Button variant="secondary" size="sm">
              Começar Configuração
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;

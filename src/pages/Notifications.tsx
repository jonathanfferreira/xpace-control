import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, TrendingDown, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDemo } from "@/contexts/DemoContext";

export default function Notifications() {
  const navigate = useNavigate();
  const { isDemoMode } = useDemo();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    emailOnAbsence: true,
    emailOnLatePayment: true,
  });
  const [aiAnalysis, setAiAnalysis] = useState<{
    alerts: any[];
    aiAnalysis: string;
    stats: any;
  } | null>(null);

  const handleSettingChange = async (field: string, value: boolean) => {
    setSettings({ ...settings, [field]: value });
    
    if (!isDemoMode) {
      try {
        const fieldMap: Record<string, string> = {
          notificationsEnabled: "notifications_enabled",
          emailOnAbsence: "email_on_absence",
          emailOnLatePayment: "email_on_late_payment",
        };

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from("profiles")
          .update({ [fieldMap[field]]: value })
          .eq("id", user.id);

        if (error) throw error;
        toast.success("Configuração atualizada");
      } catch (error) {
        toast.error("Erro ao atualizar configuração");
      }
    } else {
      toast.success("Configuração atualizada (demo)");
    }
  };

  const analyzeAttendance = async () => {
    if (isDemoMode) {
      // Mock AI analysis for demo
      setAiAnalysis({
        alerts: [
          {
            type: "low_attendance",
            student: "Ana Clara Santos",
            message: "Ana Clara Santos tem taxa de presença de apenas 45% (9 presenças nos últimos 30 dias)",
            severity: "high",
          },
          {
            type: "low_attendance",
            student: "Bruno Costa",
            message: "Bruno Costa tem taxa de presença de apenas 55% (11 presenças nos últimos 30 dias)",
            severity: "medium",
          },
        ],
        aiAnalysis: `📊 **Análise de Frequência - Últimos 30 dias**

**Principais Observações:**
1. **Taxa média de presença:** 72% - Acima da média nacional (65%), mas há margem para melhoria
2. **2 alunos** com frequência crítica abaixo de 60%
3. Tendência de faltas concentradas às sextas-feiras

**Recomendações Prioritárias:**
1. 🎯 **Contato imediato** com responsáveis dos alunos Ana Clara e Bruno - oferecer aulas de reposição
2. 📅 **Revisar horários de sexta** - considerar flexibilização ou atividades especiais neste dia
3. 🏆 **Programa de incentivo** - criar sistema de pontos por presença mensal
4. 📱 **Lembretes automáticos** - enviar WhatsApp 1h antes da aula para reduzir faltas esquecidas
5. 🤝 **Feedback individual** - reunião mensal com pais dos alunos com <70% de presença`,
        stats: {
          totalStudents: 10,
          averageAttendanceRate: 72,
          studentsWithLowAttendance: 2,
        },
      });
      return;
    }

    setAnalyzing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("analyze-attendance", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.error) {
        if (data.error.includes("Limite de requisições")) {
          toast.error(data.error);
        } else if (data.error.includes("Créditos insuficientes")) {
          toast.error(data.error);
        } else {
          toast.error("Erro ao analisar frequência");
        }
        return;
      }

      setAiAnalysis(data);
      toast.success("Análise concluída!");
    } catch (error: any) {
      console.error("Error analyzing attendance:", error);
      toast.error("Erro ao analisar frequência");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Notificações e Alertas</h1>
          <p className="text-muted-foreground">
            Configure notificações automáticas e análise de frequência com IA
          </p>
        </div>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Configurações de Notificações
            </CardTitle>
            <CardDescription>
              Configure quando você deseja receber notificações por email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications-enabled" className="flex flex-col gap-1">
                <span className="font-medium">Ativar Notificações</span>
                <span className="text-sm text-muted-foreground">
                  Receber notificações gerais do sistema
                </span>
              </Label>
              <Switch
                id="notifications-enabled"
                checked={settings.notificationsEnabled}
                onCheckedChange={(checked) => handleSettingChange("notificationsEnabled", checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-absence" className="flex flex-col gap-1">
                <span className="font-medium">Notificar Faltas</span>
                <span className="text-sm text-muted-foreground">
                  Email quando aluno tiver 3+ faltas consecutivas
                </span>
              </Label>
              <Switch
                id="email-absence"
                checked={settings.emailOnAbsence}
                onCheckedChange={(checked) => handleSettingChange("emailOnAbsence", checked)}
                disabled={!settings.notificationsEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="email-payment" className="flex flex-col gap-1">
                <span className="font-medium">Notificar Pagamentos Atrasados</span>
                <span className="text-sm text-muted-foreground">
                  Email quando pagamento estiver vencido
                </span>
              </Label>
              <Switch
                id="email-payment"
                checked={settings.emailOnLatePayment}
                onCheckedChange={(checked) => handleSettingChange("emailOnLatePayment", checked)}
                disabled={!settings.notificationsEnabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Análise de Frequência com IA
            </CardTitle>
            <CardDescription>
              Use IA para analisar padrões de presença e receber sugestões personalizadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={analyzeAttendance} 
              disabled={analyzing}
              className="w-full md:w-auto"
            >
              {analyzing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {analyzing ? "Analisando..." : "Analisar Frequência dos Últimos 30 Dias"}
            </Button>

            {aiAnalysis && (
              <div className="space-y-4 mt-6">
                {/* Stats Summary */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{aiAnalysis.stats.totalStudents}</div>
                      <p className="text-xs text-muted-foreground">Total de Alunos</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{aiAnalysis.stats.averageAttendanceRate}%</div>
                      <p className="text-xs text-muted-foreground">Taxa Média</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-destructive">
                        {aiAnalysis.stats.studentsWithLowAttendance}
                      </div>
                      <p className="text-xs text-muted-foreground">Alunos em Risco</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Alerts */}
                {aiAnalysis.alerts.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Alertas de Baixa Frequência
                    </h3>
                    {aiAnalysis.alerts.map((alert, index) => (
                      <Card key={index} className="border-destructive/50">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <p className="font-medium">{alert.student}</p>
                              <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                            </div>
                            <Badge variant={alert.severity === "high" ? "destructive" : "secondary"}>
                              {alert.severity === "high" ? "Alta" : "Média"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* AI Analysis */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardHeader>
                    <CardTitle className="text-lg">💡 Análise e Recomendações da IA</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                      {aiAnalysis.aiAnalysis}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, TrendingDown, AlertTriangle, Loader2, Users, Activity } from "lucide-react";
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
  const [churnData, setChurnData] = useState<{
    atRiskStudents: any[];
    aiSuggestions: string;
    stats: any;
  } | null>(null);
  const [analyzingChurn, setAnalyzingChurn] = useState(false);

  useEffect(() => {
    loadSettings();
  }, [isDemoMode]);

  const loadSettings = async () => {
    if (isDemoMode) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("notifications_enabled, email_on_absence, email_on_late_payment")
        .eq("id", user.id)
        .single();

      if (profile) {
        setSettings({
          notificationsEnabled: profile.notifications_enabled ?? true,
          emailOnAbsence: profile.email_on_absence ?? true,
          emailOnLatePayment: profile.email_on_late_payment ?? true,
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

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

  const analyzeChurnRisk = async () => {
    if (isDemoMode) {
      // Mock churn data for demo
      setChurnData({
        atRiskStudents: [
          {
            name: "Ana Clara Santos",
            riskScore: 78,
            riskLevel: "high",
            attendanceRate: 45,
            latePaymentCount: 2,
          },
          {
            name: "Bruno Costa",
            riskScore: 62,
            riskLevel: "high",
            attendanceRate: 55,
            latePaymentCount: 1,
          },
          {
            name: "Carla Oliveira",
            riskScore: 48,
            riskLevel: "medium",
            attendanceRate: 65,
            latePaymentCount: 1,
          },
        ],
        aiSuggestions: `**Análise de Risco de Evasão**

**1. Ana Clara Santos (Score: 78/100 - ALTO RISCO)**
- **Diagnóstico:** Frequência crítica (45%) + 2 atrasos de pagamento indicam desengajamento severo
- **Ação imediata:** Ligar hoje para responsável. Oferecer 2 aulas de reposição gratuitas e desconto de 20% no próximo mês
- **Estratégia:** Agendar reunião presencial, entender motivos das faltas, propor horário alternativo

**2. Bruno Costa (Score: 62/100 - ALTO RISCO)**
- **Diagnóstico:** Baixa frequência + pagamento atrasado sugerem problemas de engajamento ou financeiros
- **Ação imediata:** Contato via WhatsApp oferecendo flexibilização de horário e parcelamento do débito
- **Estratégia:** Incluir em programa de mentoria, convidar para evento especial da escola

**3. Carla Oliveira (Score: 48/100 - MÉDIO RISCO)**
- **Diagnóstico:** Frequência no limiar aceitável mas com sinais de alerta
- **Ação imediata:** Email personalizado com feedback positivo sobre progresso técnico
- **Estratégia:** Convidar para apresentação/festival, criar senso de pertencimento`,
        stats: {
          totalStudents: 10,
          highRisk: 2,
          mediumRisk: 1,
        },
      });
      return;
    }

    setAnalyzingChurn(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase.functions.invoke("analyze-churn-risk", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data.error) {
        toast.error("Erro ao analisar risco de evasão");
        return;
      }

      setChurnData(data);
      toast.success("Análise de risco concluída!");
    } catch (error: any) {
      console.error("Error analyzing churn risk:", error);
      toast.error("Erro ao analisar risco de evasão");
    } finally {
      setAnalyzingChurn(false);
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

        {/* Churn Risk Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Análise de Risco de Evasão
            </CardTitle>
            <CardDescription>
              Identifique alunos em risco de cancelamento com base em frequência e pagamentos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={analyzeChurnRisk} 
              disabled={analyzingChurn}
              className="w-full md:w-auto"
            >
              {analyzingChurn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {analyzingChurn ? "Analisando..." : "Analisar Risco de Evasão"}
            </Button>

            {churnData && (
              <div className="space-y-4 mt-6">
                {/* Stats Summary */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">{churnData.stats.totalStudents}</div>
                      <p className="text-xs text-muted-foreground">Total de Alunos</p>
                    </CardContent>
                  </Card>
                  <Card className="border-destructive/50">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-destructive">
                        {churnData.stats.highRisk}
                      </div>
                      <p className="text-xs text-muted-foreground">Risco Alto</p>
                    </CardContent>
                  </Card>
                  <Card className="border-orange-500/50">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-orange-500">
                        {churnData.stats.mediumRisk}
                      </div>
                      <p className="text-xs text-muted-foreground">Risco Médio</p>
                    </CardContent>
                  </Card>
                </div>

                {/* At-Risk Students */}
                {churnData.atRiskStudents.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      Alunos em Risco de Evasão
                    </h3>
                    {churnData.atRiskStudents.map((student, index) => (
                      <Card 
                        key={index} 
                        className={
                          student.riskLevel === "high" 
                            ? "border-destructive/50" 
                            : "border-orange-500/50"
                        }
                      >
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <p className="font-medium">{student.name}</p>
                                <Badge 
                                  variant={student.riskLevel === "high" ? "destructive" : "secondary"}
                                  className={student.riskLevel === "medium" ? "bg-orange-500 text-white" : ""}
                                >
                                  Score: {student.riskScore}/100
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Activity className="h-3 w-3" />
                                  Frequência: {student.attendanceRate}%
                                </div>
                                <div>
                                  Atrasos: {student.latePaymentCount}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* AI Suggestions */}
                {churnData.aiSuggestions && (
                  <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-lg">💡 Ações Sugeridas pela IA</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none whitespace-pre-wrap">
                        {churnData.aiSuggestions}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

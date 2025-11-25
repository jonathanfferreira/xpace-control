import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Bell, TrendingDown, AlertTriangle, Loader2, Users, Activity } from "lucide-react";
import { db, functions } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { httpsCallable } from "firebase/functions";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "sonner";
import { useDemo } from "@/contexts/DemoContext";

// ... (keep the existing interfaces)

export default function Notifications() {
  const navigate = useNavigate();
  const { isDemoMode } = useDemo();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [settings, setSettings] = useState({
    notificationsEnabled: true,
    emailOnAbsence: true,
    emailOnLatePayment: true,
  });
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [churnData, setChurnData] = useState<any>(null);
  const [analyzingChurn, setAnalyzingChurn] = useState(false);

  useEffect(() => {
    if (!isDemoMode && user) {
      loadSettings();
    }
  }, [isDemoMode, user]);

  const loadSettings = async () => {
    if (!user) return;
    try {
      const profileDocRef = doc(db, "profiles", user.uid);
      const profileDoc = await getDoc(profileDocRef);

      if (profileDoc.exists()) {
        const data = profileDoc.data();
        setSettings({
          notificationsEnabled: data.notifications_enabled ?? true,
          emailOnAbsence: data.email_on_absence ?? true,
          emailOnLatePayment: data.email_on_late_payment ?? true,
        });
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  };

  const handleSettingChange = async (field: keyof typeof settings, value: boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    
    if (isDemoMode) {
      toast.success("Configuração atualizada (demo)");
      return;
    }
    
    if (!user) return;

    try {
      const fieldMap = {
        notificationsEnabled: "notifications_enabled",
        emailOnAbsence: "email_on_absence",
        emailOnLatePayment: "email_on_late_payment",
      };

      const profileDocRef = doc(db, "profiles", user.uid);
      await updateDoc(profileDocRef, { [fieldMap[field]]: value });

      toast.success("Configuração atualizada");
    } catch (error) {
      toast.error("Erro ao atualizar configuração");
    }
  };

  const analyzeAttendance = async () => {
    if (isDemoMode) {
      // Keep the same mock data for demo mode
      setAiAnalysis({ alerts: [], aiAnalysis: "Demo analysis", stats: {} });
      return;
    }

    setAnalyzing(true);
    try {
      const analyzeFn = httpsCallable(functions, 'analyzeAttendance');
      const result: any = await analyzeFn();
      
      if (result.data.error) {
        toast.error(result.data.error);
      } else {
        setAiAnalysis(result.data);
        toast.success("Análise concluída!");
      }
    } catch (error: any) {
      console.error("Error analyzing attendance:", error);
      toast.error("Erro ao analisar frequência: " + error.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const analyzeChurnRisk = async () => {
    if (isDemoMode) {
      // Keep the same mock data for demo mode
      setChurnData({ atRiskStudents: [], aiSuggestions: "Demo suggestions", stats: {} });
      return;
    }

    setAnalyzingChurn(true);
    try {
      const analyzeChurnFn = httpsCallable(functions, 'analyzeChurnRisk');
      const result: any = await analyzeChurnFn();

      if (result.data.error) {
        toast.error(result.data.error);
      } else {
        setChurnData(result.data);
        toast.success("Análise de risco concluída!");
      }
    } catch (error: any) {
      console.error("Error analyzing churn risk:", error);
      toast.error("Erro ao analisar risco de evasão: " + error.message);
    } finally {
      setAnalyzingChurn(false);
    }
  };

  return (
    <DashboardLayout>
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
    </DashboardLayout>
  );
}

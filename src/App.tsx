
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { DemoProvider } from "@/contexts/DemoContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { UnitProvider } from "@/contexts/UnitContext";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DemoBadge } from "@/components/DemoBadge";
import { initGA4, initMetaPixel, trackPageView } from "@/lib/analytics";

// Importando o novo Layout
import { MainLayout } from "@/components/layout/MainLayout";

import Index from "./pages/Index";
import AuthPage from "./pages/Auth";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentDetailPage from "./pages/StudentDetail"; // Rota adicionada
import Classes from "./pages/Classes";
import Attendance from "./pages/Attendance";
import Payments from "./pages/Payments";
import Notifications from "./pages/Notifications";
import Units from "./pages/Units";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Events from "./pages/Events";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import Leads from "./pages/Leads";
import DemoLogin from "./pages/DemoLogin";
import DemoReset from "./pages/DemoReset";
import DanceStyles from "./pages/DanceStyles";
import Costumes from "./pages/Costumes";
import Choreographies from "./pages/Choreographies";
import CashRegister from "./pages/financial/CashRegister";
import AccountsPayable from "./pages/financial/AccountsPayable";
import AccountsReceivable from "./pages/financial/AccountsReceivable";
import FinancialAccounts from "./pages/financial/FinancialAccounts";
import Sales from "./pages/financial/Sales";
import Commissions from "./pages/financial/Commissions";
import FinancialDashboard from "./pages/financial/FinancialDashboard";
import StudentFinancialPage from "./pages/financial/StudentFinancial";
import TeacherClasses from "./pages/teacher/TeacherClasses";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherSchedule from "./pages/teacher/TeacherSchedule";
import GuardianStudents from "./pages/guardian/GuardianStudents";
import GuardianAttendance from "./pages/guardian/GuardianAttendance";
import GuardianPayments from "./pages/guardian/GuardianPayments";
import StudentSchedule from "./pages/student/StudentSchedule";

const queryClient = new QueryClient();

function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    initGA4();
    initMetaPixel();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <ThemeProvider>
        <AuthProvider>
          <UnitProvider>
            <DemoProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <DemoBadge />
                <BrowserRouter>
                  <AnalyticsTracker />
                  <Routes>
                    {/* Rotas Públicas */}
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/demo-login" element={<DemoLogin />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/termos" element={<TermsOfService />} />
                    <Route path="/privacidade" element={<PrivacyPolicy />} />

                    {/* Rotas Protegidas com o MainLayout */}
                    <Route element={<MainLayout />}>
                      <Route path="/onboarding" element={<ProtectedRoute allowedRoles={['admin']}><Onboarding /></ProtectedRoute>} />
                      <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><Dashboard /></ProtectedRoute>} />
                      <Route path="/alunos" element={<ProtectedRoute allowedRoles={['admin']}><Students /></ProtectedRoute>} />
                      <Route path="/alunos/:studentId" element={<ProtectedRoute allowedRoles={['admin']}><StudentDetailPage /></ProtectedRoute>} />
                      <Route path="/alunos/:studentId/financeiro" element={<ProtectedRoute allowedRoles={['admin']}><StudentFinancialPage /></ProtectedRoute>} />
                      <Route path="/students" element={<ProtectedRoute allowedRoles={['admin']}><Students /></ProtectedRoute>} />
                      <Route path="/turmas" element={<ProtectedRoute allowedRoles={['admin']}><Classes /></ProtectedRoute>} />
                      <Route path="/classes" element={<ProtectedRoute allowedRoles={['admin']}><Classes /></ProtectedRoute>} />
                      <Route path="/presencas" element={<ProtectedRoute allowedRoles={['admin']}><Attendance /></ProtectedRoute>} />
                      <Route path="/attendance" element={<ProtectedRoute allowedRoles={['admin']}><Attendance /></ProtectedRoute>} />
                      <Route path="/pagamentos" element={<ProtectedRoute allowedRoles={['admin']}><Payments /></ProtectedRoute>} />
                      <Route path="/payments" element={<ProtectedRoute allowedRoles={['admin']}><Payments /></ProtectedRoute>} />
                      <Route path="/notificacoes" element={<ProtectedRoute allowedRoles={['admin']}><Notifications /></ProtectedRoute>} />
                      <Route path="/notifications" element={<ProtectedRoute allowedRoles={['admin']}><Notifications /></ProtectedRoute>} />
                      <Route path="/units" element={<ProtectedRoute allowedRoles={['admin']}><Units /></ProtectedRoute>} />
                      <Route path="/configuracoes" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
                      <Route path="/settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
                      <Route path="/planos" element={<ProtectedRoute allowedRoles={['admin']}><Pricing /></ProtectedRoute>} />
                      <Route path="/relatorios" element={<ProtectedRoute allowedRoles={['admin']}><Reports /></ProtectedRoute>} />
                      <Route path="/eventos" element={<ProtectedRoute allowedRoles={['admin']}><Events /></ProtectedRoute>} />
                      <Route path="/leads" element={<ProtectedRoute allowedRoles={['admin']}><Leads /></ProtectedRoute>} />
                      <Route path="/unidades" element={<ProtectedRoute allowedRoles={['admin']}><Units /></ProtectedRoute>} />
                      <Route path="/estilos-danca" element={<ProtectedRoute allowedRoles={['admin']}><DanceStyles /></ProtectedRoute>} />
                      <Route path="/figurinos" element={<ProtectedRoute allowedRoles={['admin']}><Costumes /></ProtectedRoute>} />
                      <Route path="/coreografias" element={<ProtectedRoute allowedRoles={['admin']}><Choreographies /></ProtectedRoute>} />
                      <Route path="/financeiro/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><FinancialDashboard /></ProtectedRoute>} />
                      <Route path="/financeiro/caixa" element={<ProtectedRoute allowedRoles={['admin']}><CashRegister /></ProtectedRoute>} />
                      <Route path="/financeiro/contas-pagar" element={<ProtectedRoute allowedRoles={['admin']}><AccountsPayable /></ProtectedRoute>} />
                      <Route path="/financeiro/contas-receber" element={<ProtectedRoute allowedRoles={['admin']}><AccountsReceivable /></ProtectedRoute>} />
                      <Route path="/financeiro/contas-financeiras" element={<ProtectedRoute allowedRoles={['admin']}><FinancialAccounts /></ProtectedRoute>} />
                      <Route path="/financeiro/vendas" element={<ProtectedRoute allowedRoles={['admin']}><Sales /></ProtectedRoute>} />
                      <Route path="/financeiro/comissoes" element={<ProtectedRoute allowedRoles={['admin']}><Commissions /></ProtectedRoute>} />
                      <Route path="/professor/turmas" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherClasses /></ProtectedRoute>} />
                      <Route path="/professor/presencas" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherAttendance /></ProtectedRoute>} />
                      <Route path="/professor/agenda" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherSchedule /></ProtectedRoute>} />
                      <Route path="/responsavel/alunos" element={<ProtectedRoute allowedRoles={['guardian']}><GuardianStudents /></ProtectedRoute>} />
                      <Route path="/guardian/students" element={<ProtectedRoute allowedRoles={['guardian']}><GuardianStudents /></ProtectedRoute>} />
                      <Route path="/responsavel/presencas" element={<ProtectedRoute allowedRoles={['guardian']}><GuardianAttendance /></ProtectedRoute>} />
                      <Route path="/guardian/attendance" element={<ProtectedRoute allowedRoles={['guardian']}><GuardianAttendance /></ProtectedRoute>} />
                      <Route path="/responsavel/pagamentos" element={<ProtectedRoute allowedRoles={['guardian']}><GuardianPayments /></ProtectedRoute>} />
                      <Route path="/guardian/payments" element={<ProtectedRoute allowedRoles={['guardian']}><GuardianPayments /></ProtectedRoute>} />
                      <Route path="/aluno/agenda" element={<ProtectedRoute allowedRoles={['student', 'admin']}><StudentSchedule /></ProtectedRoute>} />
                    </Route>

                    {/* Rota de Admin Especial e Rota Not Found */}
                    <Route path="/admin/demo-reset" element={<DemoReset />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </TooltipProvider>
            </DemoProvider>
          </UnitProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;

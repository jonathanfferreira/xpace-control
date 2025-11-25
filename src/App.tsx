
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
import { SchoolThemeProvider } from "@/contexts/SchoolThemeContext";

// Importando Layouts
import DashboardLayout from "@/layouts/DashboardLayout";

// Importando Páginas
import Index from "./pages/Index";
import AuthPage from "./pages/Auth";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import StudentDetailPage from "./pages/StudentDetailPage";
import Classes from "./pages/Classes";
import Attendance from "./pages/Attendance";
import Payments from "./pages/Payments";
import Notifications from "./pages/Notifications";
import Units from "./pages/Units";
import Settings from "./pages/Settings";
import Reports from "./pages/Reports";
import Events from "./pages/Events";
import EventDetailPage from "./pages/EventDetail";
import PublicEventPage from "./pages/PublicEventPage";
import EventScannerPage from "./pages/EventScanner";
import Products from "./pages/Products";
import PublicStore from "./pages/PublicStore";
import CheckoutPage from "./pages/Checkout";
import Announcements from "./pages/Announcements";
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
import Staff from "./pages/Staff"; // <-- Importado

// Páginas Financeiras
import CashRegister from "./pages/financial/CashRegister";
import AccountsPayable from "./pages/financial/AccountsPayable";
import AccountsReceivable from "./pages/financial/AccountsReceivable";
import FinancialAccounts from "./pages/financial/FinancialAccounts";
import Sales from "./pages/financial/Sales";
import Commissions from "./pages/financial/Commissions";
import FinancialDashboard from "./pages/financial/FinancialDashboard";
import StudentFinancialPage from "./pages/financial/StudentFinancial";
import SchoolPlansPage from "./pages/financial/Plans";
// Páginas de Perfis
import TeacherClasses from "./pages/teacher/TeacherClasses";
import TeacherClassDetail from "./pages/teacher/TeacherClassDetail";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherSchedule from "./pages/teacher/TeacherSchedule";
import GuardianStudents from "./pages/guardian/GuardianStudents";
import GuardianAttendance from "./pages/guardian/GuardianAttendance";
import GuardianPayments from "./pages/guardian/GuardianPayments";
import GuardianEvaluations from "./pages/guardian/GuardianEvaluations";
import GuardianStudentDocuments from "./pages/guardian/GuardianStudentDocuments";
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
          <SchoolThemeProvider>
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
                      <Route path="/evento/:eventId" element={<PublicEventPage />} />
                      <Route path="/loja" element={<PublicStore />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      
                      {/* Rotas de Função Única */}
                      <Route path="/onboarding" element={<Onboarding />} />
                      <Route path="/eventos/:eventId/scanner" element={<ProtectedRoute allowedRoles={['admin']}><EventScannerPage /></ProtectedRoute>} />

                      {/* Rotas Protegidas com o DashboardLayout */}
                      <Route element={<DashboardLayout />}>
                        <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'guardian', 'student']}><Dashboard /></ProtectedRoute>} />
                        <Route path="/alunos" element={<ProtectedRoute allowedRoles={['admin']}><Students /></ProtectedRoute>} />
                        <Route path="/alunos/:studentId" element={<ProtectedRoute allowedRoles={['admin']}><StudentDetailPage /></ProtectedRoute>} />
                        <Route path="/alunos/:studentId/financeiro" element={<ProtectedRoute allowedRoles={['admin']}><StudentFinancialPage /></ProtectedRoute>} />
                        <Route path="/turmas" element={<ProtectedRoute allowedRoles={['admin']}><Classes /></ProtectedRoute>} />
                        <Route path="/presencas" element={<ProtectedRoute allowedRoles={['admin']}><Attendance /></ProtectedRoute>} />
                        <Route path="/comunicados" element={<ProtectedRoute allowedRoles={['admin']}><Announcements /></ProtectedRoute>} />
                        <Route path="/staff" element={<ProtectedRoute allowedRoles={['admin']}><Staff /></ProtectedRoute>} /> {/* <-- Rota Adicionada */}
                        <Route path="/notificacoes" element={<ProtectedRoute allowedRoles={['admin']}><Notifications /></ProtectedRoute>} />
                        <Route path="/unidades" element={<ProtectedRoute allowedRoles={['admin']}><Units /></ProtectedRoute>} />
                        <Route path="/configuracoes" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
                        <Route path="/relatorios" element={<ProtectedRoute allowedRoles={['admin']}><Reports /></ProtectedRoute>} />
                        <Route path="/leads" element={<ProtectedRoute allowedRoles={['admin']}><Leads /></ProtectedRoute>} />
                        
                        {/* Financeiro */}
                        <Route path="/financeiro/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><FinancialDashboard /></ProtectedRoute>} />
                        <Route path="/financeiro/planos" element={<ProtectedRoute allowedRoles={['admin']}><SchoolPlansPage /></ProtectedRoute>} />
                        <Route path="/financeiro/contas-receber" element={<ProtectedRoute allowedRoles={['admin']}><AccountsReceivable /></ProtectedRoute>} />

                        {/* Artístico */}
                        <Route path="/figurinos" element={<ProtectedRoute allowedRoles={['admin']}><Costumes /></ProtectedRoute>} />
                        <Route path="/coreografias" element={<ProtectedRoute allowedRoles={['admin']}><Choreographies /></ProtectedRoute>} />
                        <Route path="/eventos" element={<ProtectedRoute allowedRoles={['admin']}><Events /></ProtectedRoute>} />
                        <Route path="/eventos/:eventId" element={<ProtectedRoute allowedRoles={['admin']}><EventDetailPage /></ProtectedRoute>} />
                        <Route path="/produtos" element={<ProtectedRoute allowedRoles={['admin']}><Products /></ProtectedRoute>} />

                        {/* Rotas do Professor */}
                        <Route path="/professor/turmas" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherClasses /></ProtectedRoute>} />
                        <Route path="/professor/turmas/:classId" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherClassDetail /></ProtectedRoute>} />
                        <Route path="/professor/presencas/:classId" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherAttendance /></ProtectedRoute>} />
                        <Route path="/professor/agenda" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherSchedule /></ProtectedRoute>} />
                        
                        {/* Rotas do Responsável */}
                        <Route path="/responsavel/alunos" element={<ProtectedRoute allowedRoles={['guardian']}><GuardianStudents /></ProtectedRoute>} />
                        <Route path="/responsavel/presencas" element={<ProtectedRoute allowedRoles={['guardian']}><GuardianAttendance /></ProtectedRoute>} />
                        <Route path="/responsavel/pagamentos" element={<ProtectedRoute allowedRoles={['guardian']}><GuardianPayments /></ProtectedRoute>} />
                        <Route path="/responsavel/avaliacoes/:studentId" element={<ProtectedRoute allowedRoles={['guardian']}><GuardianEvaluations /></ProtectedRoute>} />
                        <Route path="/responsavel/documentos/:studentId" element={<ProtectedRoute allowedRoles={['guardian']}><GuardianStudentDocuments /></ProtectedRoute>} />
                        
                        {/* Rotas do Aluno */}
                        <Route path="/aluno/agenda" element={<ProtectedRoute allowedRoles={['student', 'admin']}><StudentSchedule /></ProtectedRoute>} />
                      </Route>

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </BrowserRouter>
                </TooltipProvider>
              </DemoProvider>
            </UnitProvider>
          </SchoolThemeProvider>
        </AuthProvider>
      </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;

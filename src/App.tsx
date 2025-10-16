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
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { initGA4, initMetaPixel, trackPageView } from "@/lib/analytics";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
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

import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ResetPassword from "./pages/ResetPassword";
import Leads from "./pages/Leads";

import TeacherClasses from "./pages/teacher/TeacherClasses";
import QRCodeDisplay from "./pages/teacher/QRCodeDisplay";

import GuardianStudents from "./pages/guardian/GuardianStudents";

import StudentSchedule from "./pages/student/StudentSchedule";
import QRCodeScanner from "./pages/student/QRCodeScanner";

const queryClient = new QueryClient();

// Analytics tracking component
function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Initialize analytics on mount
    initGA4();
    initMetaPixel();
  }, []);

  useEffect(() => {
    // Track page views on route change
    trackPageView(location.pathname, document.title);
  }, [location]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <ThemeProvider>
        <UnitProvider>
          <DemoProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AnalyticsTracker />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/entrar" element={<SignIn />} />
              <Route path="/cadastro" element={<SignUp />} />
              <Route path="/recuperar" element={<ResetPassword />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/termos" element={<TermsOfService />} />
              <Route path="/privacidade" element={<PrivacyPolicy />} />
              <Route path="/onboarding" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Onboarding />
                </ProtectedRoute>
              } />

              {/* Admin routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/alunos" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Students />
                </ProtectedRoute>
              } />
              <Route path="/students" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Students />
                </ProtectedRoute>
              } />
              <Route path="/turmas" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Classes />
                </ProtectedRoute>
              } />
              <Route path="/classes" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Classes />
                </ProtectedRoute>
              } />
              <Route path="/presencas" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Attendance />
                </ProtectedRoute>
              } />
              <Route path="/attendance" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Attendance />
                </ProtectedRoute>
              } />
              <Route path="/pagamentos" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Payments />
                </ProtectedRoute>
              } />
              <Route path="/payments" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Payments />
                </ProtectedRoute>
              } />
              <Route path="/notificacoes" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Notifications />
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Notifications />
                </ProtectedRoute>
              } />
              <Route path="/units" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Units />
                </ProtectedRoute>
              } />
              <Route path="/configuracoes" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/planos" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Pricing />
                </ProtectedRoute>
              } />
              <Route path="/relatorios" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Reports />
                </ProtectedRoute>
              } />
              <Route path="/eventos" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Events />
                </ProtectedRoute>
              } />
              <Route path="/leads" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Leads />
                </ProtectedRoute>
              } />

              {/* Teacher routes */}
              <Route path="/professor/turmas" element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <TeacherClasses />
                </ProtectedRoute>
              } />
              <Route path="/professor/qrcode" element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <QRCodeDisplay />
                </ProtectedRoute>
              } />

              {/* Guardian routes */}
              <Route path="/responsavel/alunos" element={
                <ProtectedRoute allowedRoles={['parent']}>
                  <GuardianStudents />
                </ProtectedRoute>
              } />

              {/* Student routes */}
              <Route path="/aluno/agenda" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <StudentSchedule />
                </ProtectedRoute>
              } />
              <Route path="/aluno/qrcode" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <QRCodeScanner />
                </ProtectedRoute>
              } />

              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </DemoProvider>
        </UnitProvider>
    </ThemeProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;

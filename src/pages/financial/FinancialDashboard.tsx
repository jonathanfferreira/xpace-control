import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, TrendingUp, TrendingDown, Wallet, AlertCircle, CheckCircle } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  balance: number;
  pendingReceivables: number;
  overdueReceivables: number;
  pendingPayables: number;
  overduePayables: number;
  cashBalance: number;
}

export default function FinancialDashboard() {
  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalExpenses: 0,
    balance: 0,
    pendingReceivables: 0,
    overdueReceivables: 0,
    pendingPayables: 0,
    overduePayables: 0,
    cashBalance: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const fetchFinancialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('admin_id', user.id)
        .single();

      if (!school) return;

      // Buscar todas as informações financeiras
      const [receivables, payables, accounts] = await Promise.all([
        supabase
          .from('accounts_receivable')
          .select('amount, status')
          .eq('school_id', school.id),
        supabase
          .from('accounts_payable')
          .select('amount, status')
          .eq('school_id', school.id),
        supabase
          .from('financial_accounts')
          .select('balance, active')
          .eq('school_id', school.id)
      ]);

      if (receivables.error) throw receivables.error;
      if (payables.error) throw payables.error;
      if (accounts.error) throw accounts.error;

      const totalRevenue = receivables.data
        ?.filter(r => r.status === 'paid')
        .reduce((sum, r) => sum + r.amount, 0) || 0;

      const totalExpenses = payables.data
        ?.filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + p.amount, 0) || 0;

      const pendingReceivables = receivables.data
        ?.filter(r => r.status === 'pending')
        .reduce((sum, r) => sum + r.amount, 0) || 0;

      const overdueReceivables = receivables.data
        ?.filter(r => r.status === 'overdue')
        .reduce((sum, r) => sum + r.amount, 0) || 0;

      const pendingPayables = payables.data
        ?.filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + p.amount, 0) || 0;

      const overduePayables = payables.data
        ?.filter(p => p.status === 'overdue')
        .reduce((sum, p) => sum + p.amount, 0) || 0;

      const cashBalance = accounts.data
        ?.filter(a => a.active)
        .reduce((sum, a) => sum + a.balance, 0) || 0;

      setSummary({
        totalRevenue,
        totalExpenses,
        balance: totalRevenue - totalExpenses,
        pendingReceivables,
        overdueReceivables,
        pendingPayables,
        overduePayables,
        cashBalance
      });
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados financeiros",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const revenueVsExpensesData = [
    { name: 'Receitas', value: summary.totalRevenue },
    { name: 'Despesas', value: summary.totalExpenses }
  ];

  const receivablesData = [
    { name: 'Recebido', value: summary.totalRevenue },
    { name: 'Pendente', value: summary.pendingReceivables },
    { name: 'Vencido', value: summary.overdueReceivables }
  ];

  const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Financeiro</h1>
        <p className="text-muted-foreground">Visão geral das finanças da escola</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {summary.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total recebido</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {summary.totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total pago</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <DollarSign className={`h-4 w-4 ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {summary.balance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Receitas - Despesas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Caixa</CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              R$ {summary.cashBalance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Saldo em contas</p>
          </CardContent>
        </Card>
      </div>

      {/* Contas a Receber e Pagar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Contas a Receber</CardTitle>
            <CardDescription>Status dos recebimentos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Recebido</span>
              </div>
              <span className="font-bold text-green-600">R$ {summary.totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Pendente</span>
              </div>
              <span className="font-bold text-yellow-600">R$ {summary.pendingReceivables.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Vencido</span>
              </div>
              <span className="font-bold text-red-600">R$ {summary.overdueReceivables.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contas a Pagar</CardTitle>
            <CardDescription>Status dos pagamentos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Pago</span>
              </div>
              <span className="font-bold text-green-600">R$ {summary.totalExpenses.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-yellow-600" />
                <span className="text-sm">Pendente</span>
              </div>
              <span className="font-bold text-yellow-600">R$ {summary.pendingPayables.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm">Vencido</span>
              </div>
              <span className="font-bold text-red-600">R$ {summary.overduePayables.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Receitas vs Despesas</CardTitle>
            <CardDescription>Comparação de receitas e despesas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueVsExpensesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
                <Bar dataKey="value" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status de Recebimentos</CardTitle>
            <CardDescription>Distribuição de contas a receber</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={receivablesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {receivablesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


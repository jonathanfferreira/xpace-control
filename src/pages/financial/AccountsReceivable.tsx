import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, DollarSign, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AccountReceivable {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method: string | null;
  installment_number: number;
  total_installments: number;
  student: { full_name: string } | null;
  revenue_category: { name: string } | null;
}

export default function AccountsReceivable() {
  const [accounts, setAccounts] = useState<AccountReceivable[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newAccount, setNewAccount] = useState({
    description: '',
    amount: '',
    due_date: '',
    student_id: '',
    revenue_category_id: '',
    installments: '1'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('admin_id', user.id)
        .single();

      if (!school) return;

      const [accountsData, studentsData, categoriesData] = await Promise.all([
        supabase
          .from('accounts_receivable')
          .select(`
            *,
            student:students(full_name),
            revenue_category:revenue_categories(name)
          `)
          .eq('school_id', school.id)
          .order('due_date', { ascending: false }),
        supabase
          .from('students')
          .select('id, full_name')
          .eq('school_id', school.id)
          .eq('active', true),
        supabase
          .from('revenue_categories')
          .select('*')
          .eq('school_id', school.id)
      ]);

      if (accountsData.error) throw accountsData.error;
      if (studentsData.error) throw studentsData.error;
      if (categoriesData.error) throw categoriesData.error;

      setAccounts(accountsData.data || []);
      setStudents(studentsData.data || []);
      setCategories(categoriesData.data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('admin_id', user.id)
        .single();

      if (!school) return;

      const totalInstallments = parseInt(newAccount.installments);
      const installmentAmount = parseFloat(newAccount.amount) / totalInstallments;
      const baseDate = new Date(newAccount.due_date);

      const installments = Array.from({ length: totalInstallments }, (_, i) => {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        return {
          school_id: school.id,
          student_id: newAccount.student_id || null,
          revenue_category_id: newAccount.revenue_category_id || null,
          description: `${newAccount.description} (${i + 1}/${totalInstallments})`,
          amount: installmentAmount,
          due_date: dueDate.toISOString().split('T')[0],
          installment_number: i + 1,
          total_installments: totalInstallments,
          status: 'pending'
        };
      });

      const { error } = await supabase
        .from('accounts_receivable')
        .insert(installments);

      if (error) throw error;

      toast({
        title: "Conta criada com sucesso!",
        description: `${totalInstallments}x de R$ ${installmentAmount.toFixed(2)}`
      });

      setDialogOpen(false);
      setNewAccount({ description: '', amount: '', due_date: '', student_id: '', revenue_category_id: '', installments: '1' });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleMarkAsReceived = async (id: string, amount: number) => {
    try {
      const { error } = await supabase
        .from('accounts_receivable')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Recebimento registrado!",
        description: `R$ ${amount.toFixed(2)} recebido com sucesso`
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao registrar recebimento",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: 'default',
      paid: 'success',
      overdue: 'destructive',
      cancelled: 'secondary'
    };
    const labels: any = {
      pending: 'Pendente',
      paid: 'Recebido',
      overdue: 'Vencido',
      cancelled: 'Cancelado'
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const totalReceived = accounts.filter(a => a.status === 'paid').reduce((sum, a) => sum + a.amount, 0);
  const totalPending = accounts.filter(a => a.status === 'pending').reduce((sum, a) => sum + a.amount, 0);
  const totalOverdue = accounts.filter(a => a.status === 'overdue').reduce((sum, a) => sum + a.amount, 0);

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contas a Receber</h1>
          <p className="text-muted-foreground">Gestão de mensalidades e recebimentos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Conta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Conta a Receber</DialogTitle>
              <DialogDescription>Cadastre uma nova receita</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Aluno</Label>
                <Select value={newAccount.student_id} onValueChange={(value) => setNewAccount({...newAccount, student_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>{student.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descrição</Label>
                <Input
                  value={newAccount.description}
                  onChange={(e) => setNewAccount({...newAccount, description: e.target.value})}
                  placeholder="Ex: Mensalidade, Taxa de matrícula..."
                />
              </div>
              <div>
                <Label>Valor Total</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newAccount.amount}
                  onChange={(e) => setNewAccount({...newAccount, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Parcelas</Label>
                <Input
                  type="number"
                  min="1"
                  value={newAccount.installments}
                  onChange={(e) => setNewAccount({...newAccount, installments: e.target.value})}
                />
              </div>
              <div>
                <Label>Primeiro Vencimento</Label>
                <Input
                  type="date"
                  value={newAccount.due_date}
                  onChange={(e) => setNewAccount({...newAccount, due_date: e.target.value})}
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={newAccount.revenue_category_id} onValueChange={(value) => setNewAccount({...newAccount, revenue_category_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full">Criar Conta</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {(totalReceived + totalPending + totalOverdue).toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recebido</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {totalReceived.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Aberto</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">R$ {totalPending.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ {totalOverdue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Receitas</CardTitle>
          <CardDescription>Lista de todas as contas a receber</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Recebimento</TableHead>
                <TableHead>Parcela</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.student?.full_name || '-'}</TableCell>
                  <TableCell>{account.description}</TableCell>
                  <TableCell>{format(new Date(account.due_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  <TableCell>{account.payment_date ? format(new Date(account.payment_date), "dd/MM/yyyy", { locale: ptBR }) : '-'}</TableCell>
                  <TableCell>{account.installment_number}/{account.total_installments}</TableCell>
                  <TableCell>{getStatusBadge(account.status)}</TableCell>
                  <TableCell className="text-right font-medium">R$ {account.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    {account.status === 'pending' && (
                      <Button size="sm" onClick={() => handleMarkAsReceived(account.id, account.amount)}>
                        Receber
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


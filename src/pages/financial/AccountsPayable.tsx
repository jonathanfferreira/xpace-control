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
import { Plus, DollarSign, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AccountPayable {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  payment_date: string | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method: string | null;
  expense_category: { name: string } | null;
}

export default function AccountsPayable() {
  const [accounts, setAccounts] = useState<AccountPayable[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newAccount, setNewAccount] = useState({
    description: '',
    amount: '',
    due_date: '',
    expense_category_id: '',
    payment_method: '',
    is_recurring: false
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

      const [accountsData, categoriesData] = await Promise.all([
        supabase
          .from('accounts_payable')
          .select(`
            *,
            expense_category:expense_categories(name)
          `)
          .eq('school_id', school.id)
          .order('due_date', { ascending: false }),
        supabase
          .from('expense_categories')
          .select('*')
          .eq('school_id', school.id)
      ]);

      if (accountsData.error) throw accountsData.error;
      if (categoriesData.error) throw categoriesData.error;

      setAccounts(accountsData.data || []);
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

      const { error } = await supabase
        .from('accounts_payable')
        .insert({
          school_id: school.id,
          description: newAccount.description,
          amount: parseFloat(newAccount.amount),
          due_date: newAccount.due_date,
          expense_category_id: newAccount.expense_category_id || null,
          is_recurring: newAccount.is_recurring,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Conta criada com sucesso!",
        description: `Despesa de R$ ${parseFloat(newAccount.amount).toFixed(2)}`
      });

      setDialogOpen(false);
      setNewAccount({ description: '', amount: '', due_date: '', expense_category_id: '', payment_method: '', is_recurring: false });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleMarkAsPaid = async (id: string, amount: number) => {
    try {
      const { error } = await supabase
        .from('accounts_payable')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Pagamento registrado!",
        description: `R$ ${amount.toFixed(2)} pago com sucesso`
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao registrar pagamento",
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
      paid: 'Pago',
      overdue: 'Vencido',
      cancelled: 'Cancelado'
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const totalPending = accounts.filter(a => a.status === 'pending').reduce((sum, a) => sum + a.amount, 0);
  const totalPaid = accounts.filter(a => a.status === 'paid').reduce((sum, a) => sum + a.amount, 0);
  const totalOverdue = accounts.filter(a => a.status === 'overdue').reduce((sum, a) => sum + a.amount, 0);

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contas a Pagar</h1>
          <p className="text-muted-foreground">Gestão de despesas e pagamentos</p>
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
              <DialogTitle>Nova Conta a Pagar</DialogTitle>
              <DialogDescription>Cadastre uma nova despesa</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Descrição</Label>
                <Input
                  value={newAccount.description}
                  onChange={(e) => setNewAccount({...newAccount, description: e.target.value})}
                  placeholder="Ex: Aluguel, Energia, Água..."
                />
              </div>
              <div>
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newAccount.amount}
                  onChange={(e) => setNewAccount({...newAccount, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Data de Vencimento</Label>
                <Input
                  type="date"
                  value={newAccount.due_date}
                  onChange={(e) => setNewAccount({...newAccount, due_date: e.target.value})}
                />
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={newAccount.expense_category_id} onValueChange={(value) => setNewAccount({...newAccount, expense_category_id: value})}>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Pago</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {totalPaid.toFixed(2)}</div>
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
            <CardTitle className="text-sm font-medium">Vencido</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ {totalOverdue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Despesas</CardTitle>
          <CardDescription>Lista de todas as contas a pagar</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.description}</TableCell>
                  <TableCell>{account.expense_category?.name || '-'}</TableCell>
                  <TableCell>{format(new Date(account.due_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  <TableCell>{account.payment_date ? format(new Date(account.payment_date), "dd/MM/yyyy", { locale: ptBR }) : '-'}</TableCell>
                  <TableCell>{getStatusBadge(account.status)}</TableCell>
                  <TableCell className="text-right font-medium">R$ {account.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    {account.status === 'pending' && (
                      <Button size="sm" onClick={() => handleMarkAsPaid(account.id, account.amount)}>
                        Pagar
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


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
import { DollarSign, Plus, X, ArrowDownCircle, ArrowUpCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface CashRegister {
  id: string;
  opening_date: string;
  closing_date: string | null;
  opening_balance: number;
  closing_balance: number | null;
  status: 'open' | 'closed';
  financial_account: { name: string };
}

interface Transaction {
  id: string;
  type: 'entry' | 'exit';
  amount: number;
  payment_method: string;
  description: string;
  created_at: string;
}

export default function CashRegister() {
  const [cashRegisters, setCashRegisters] = useState<CashRegister[]>([]);
  const [currentRegister, setCurrentRegister] = useState<CashRegister | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [transactionDialog, setTransactionDialog] = useState(false);
  const { toast } = useToast();

  const [newTransaction, setNewTransaction] = useState({
    type: 'entry' as 'entry' | 'exit',
    amount: '',
    payment_method: 'cash',
    description: ''
  });

  useEffect(() => {
    fetchCashRegisters();
  }, []);

  const fetchCashRegisters = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('admin_id', user.id)
        .single();

      if (!school) return;

      const { data, error } = await supabase
        .from('cash_registers')
        .select(`
          *,
          financial_account:financial_accounts(name)
        `)
        .eq('school_id', school.id)
        .order('opening_date', { ascending: false });

      if (error) throw error;

      setCashRegisters(data || []);
      
      const openRegister = data?.find(r => r.status === 'open');
      if (openRegister) {
        setCurrentRegister(openRegister);
        fetchTransactions(openRegister.id);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar caixas",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (registerId: string) => {
    try {
      const { data, error } = await supabase
        .from('cash_register_transactions')
        .select('*')
        .eq('cash_register_id', registerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar transações",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleOpenCashRegister = async (accountId: string, openingBalance: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('admin_id', user.id)
        .single();

      if (!school) return;

      const { data, error } = await supabase
        .from('cash_registers')
        .insert({
          school_id: school.id,
          financial_account_id: accountId,
          opened_by: user.id,
          opening_balance: openingBalance,
          status: 'open'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Caixa aberto com sucesso!",
        description: `Saldo inicial: R$ ${openingBalance.toFixed(2)}`
      });

      setOpenDialog(false);
      fetchCashRegisters();
    } catch (error: any) {
      toast({
        title: "Erro ao abrir caixa",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleAddTransaction = async () => {
    if (!currentRegister) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('cash_register_transactions')
        .insert({
          cash_register_id: currentRegister.id,
          type: newTransaction.type,
          amount: parseFloat(newTransaction.amount),
          payment_method: newTransaction.payment_method,
          description: newTransaction.description,
          source: 'other',
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Transação registrada!",
        description: `${newTransaction.type === 'entry' ? 'Entrada' : 'Saída'} de R$ ${parseFloat(newTransaction.amount).toFixed(2)}`
      });

      setTransactionDialog(false);
      setNewTransaction({ type: 'entry', amount: '', payment_method: 'cash', description: '' });
      fetchTransactions(currentRegister.id);
    } catch (error: any) {
      toast({
        title: "Erro ao registrar transação",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const calculateBalance = () => {
    if (!currentRegister) return 0;
    
    const entries = transactions
      .filter(t => t.type === 'entry')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const exits = transactions
      .filter(t => t.type === 'exit')
      .reduce((sum, t) => sum + t.amount, 0);
    
    return currentRegister.opening_balance + entries - exits;
  };

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Caixa</h1>
          <p className="text-muted-foreground">Controle de caixa diário</p>
        </div>
        <div className="flex gap-2">
          {!currentRegister && (
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Abrir Caixa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Abrir Novo Caixa</DialogTitle>
                  <DialogDescription>
                    Informe o saldo inicial para abrir um novo caixa
                  </DialogDescription>
                </DialogHeader>
                {/* Form para abrir caixa */}
              </DialogContent>
            </Dialog>
          )}
          {currentRegister && (
            <>
              <Button onClick={() => setTransactionDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
              <Button variant="destructive">
                <X className="h-4 w-4 mr-2" />
                Fechar Caixa
              </Button>
            </>
          )}
        </div>
      </div>

      {currentRegister && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Inicial</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {currentRegister.opening_balance.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Entradas</CardTitle>
              <ArrowDownCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                R$ {transactions.filter(t => t.type === 'entry').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saídas</CardTitle>
              <ArrowUpCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                R$ {transactions.filter(t => t.type === 'exit').reduce((sum, t) => sum + t.amount, 0).toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Movimentações</CardTitle>
          <CardDescription>
            {currentRegister ? 'Transações do caixa atual' : 'Nenhum caixa aberto'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {format(new Date(transaction.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={transaction.type === 'entry' ? 'default' : 'destructive'}>
                      {transaction.type === 'entry' ? 'Entrada' : 'Saída'}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{transaction.payment_method}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell className={`text-right font-medium ${transaction.type === 'entry' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'entry' ? '+' : '-'} R$ {transaction.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog para nova transação */}
      <Dialog open={transactionDialog} onOpenChange={setTransactionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
            <DialogDescription>
              Registre uma entrada ou saída no caixa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo</Label>
              <Select value={newTransaction.type} onValueChange={(value: 'entry' | 'exit') => setNewTransaction({...newTransaction, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entrada</SelectItem>
                  <SelectItem value="exit">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor</Label>
              <Input
                type="number"
                step="0.01"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label>Método de Pagamento</Label>
              <Select value={newTransaction.payment_method} onValueChange={(value) => setNewTransaction({...newTransaction, payment_method: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="bank_transfer">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Descrição</Label>
              <Input
                value={newTransaction.description}
                onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                placeholder="Descrição da transação"
              />
            </div>
            <Button onClick={handleAddTransaction} className="w-full">
              Registrar Transação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}


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
import { Plus, Building2, CreditCard, Wallet, TrendingUp } from "lucide-react";

interface FinancialAccount {
  id: string;
  name: string;
  type: 'cash' | 'bank_account' | 'credit_card' | 'other';
  balance: number;
  bank_name: string | null;
  account_number: string | null;
  active: boolean;
}

export default function FinancialAccounts() {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'bank_account' as 'cash' | 'bank_account' | 'credit_card' | 'other',
    initial_balance: '',
    bank_name: '',
    account_number: ''
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
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
        .from('financial_accounts')
        .select('*')
        .eq('school_id', school.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccounts(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar contas",
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
        .from('financial_accounts')
        .insert({
          school_id: school.id,
          name: newAccount.name,
          type: newAccount.type,
          balance: parseFloat(newAccount.initial_balance) || 0,
          bank_name: newAccount.bank_name || null,
          account_number: newAccount.account_number || null,
          active: true
        });

      if (error) throw error;

      toast({
        title: "Conta criada com sucesso!",
        description: `${newAccount.name} adicionada ao sistema`
      });

      setDialogOpen(false);
      setNewAccount({ name: '', type: 'bank_account', initial_balance: '', bank_name: '', account_number: '' });
      fetchAccounts();
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'cash':
        return <Wallet className="h-4 w-4" />;
      case 'bank_account':
        return <Building2 className="h-4 w-4" />;
      case 'credit_card':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: any = {
      cash: 'Dinheiro',
      bank_account: 'Conta Bancária',
      credit_card: 'Cartão de Crédito',
      other: 'Outro'
    };
    return labels[type] || type;
  };

  const totalBalance = accounts.filter(a => a.active).reduce((sum, a) => sum + a.balance, 0);

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Contas Financeiras</h1>
          <p className="text-muted-foreground">Gestão de contas bancárias e caixas</p>
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
              <DialogTitle>Nova Conta Financeira</DialogTitle>
              <DialogDescription>Cadastre uma nova conta bancária ou caixa</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome da Conta</Label>
                <Input
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({...newAccount, name: e.target.value})}
                  placeholder="Ex: Caixa Principal, Banco Inter..."
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={newAccount.type} onValueChange={(value: any) => setNewAccount({...newAccount, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Dinheiro</SelectItem>
                    <SelectItem value="bank_account">Conta Bancária</SelectItem>
                    <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newAccount.type === 'bank_account' && (
                <>
                  <div>
                    <Label>Banco</Label>
                    <Input
                      value={newAccount.bank_name}
                      onChange={(e) => setNewAccount({...newAccount, bank_name: e.target.value})}
                      placeholder="Ex: Banco Inter, Nubank..."
                    />
                  </div>
                  <div>
                    <Label>Número da Conta</Label>
                    <Input
                      value={newAccount.account_number}
                      onChange={(e) => setNewAccount({...newAccount, account_number: e.target.value})}
                      placeholder="Ex: 12345-6"
                    />
                  </div>
                </>
              )}
              <div>
                <Label>Saldo Inicial</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newAccount.initial_balance}
                  onChange={(e) => setNewAccount({...newAccount, initial_balance: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <Button onClick={handleCreate} className="w-full">Criar Conta</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Saldo Total</CardTitle>
          <CardDescription>Soma de todas as contas ativas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold">R$ {totalBalance.toFixed(2)}</div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <Card key={account.id} className={!account.active ? 'opacity-50' : ''}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{account.name}</CardTitle>
              {getTypeIcon(account.type)}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {account.balance.toFixed(2)}</div>
              <div className="flex items-center justify-between mt-2">
                <Badge variant="outline">{getTypeLabel(account.type)}</Badge>
                <Badge variant={account.active ? 'default' : 'secondary'}>
                  {account.active ? 'Ativa' : 'Inativa'}
                </Badge>
              </div>
              {account.bank_name && (
                <p className="text-sm text-muted-foreground mt-2">
                  {account.bank_name} {account.account_number && `• ${account.account_number}`}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as Contas</CardTitle>
          <CardDescription>Lista completa de contas financeiras</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Banco</TableHead>
                <TableHead>Conta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell>{getTypeLabel(account.type)}</TableCell>
                  <TableCell>{account.bank_name || '-'}</TableCell>
                  <TableCell>{account.account_number || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={account.active ? 'default' : 'secondary'}>
                      {account.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">R$ {account.balance.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}


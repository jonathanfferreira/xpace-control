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
import { Plus, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Sale {
  id: string;
  description: string;
  amount: number;
  discount: number;
  final_amount: number;
  payment_method: string;
  status: 'completed' | 'pending' | 'cancelled';
  sale_date: string;
  student: { full_name: string } | null;
}

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newSale, setNewSale] = useState({
    description: '',
    amount: '',
    discount: '0',
    payment_method: 'cash',
    student_id: ''
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

      const [salesData, studentsData] = await Promise.all([
        supabase
          .from('sales')
          .select(`
            *,
            student:students(full_name)
          `)
          .eq('school_id', school.id)
          .order('sale_date', { ascending: false }),
        supabase
          .from('students')
          .select('id, full_name')
          .eq('school_id', school.id)
          .eq('active', true)
      ]);

      if (salesData.error) throw salesData.error;
      if (studentsData.error) throw studentsData.error;

      setSales(salesData.data || []);
      setStudents(studentsData.data || []);
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

      const amount = parseFloat(newSale.amount);
      const discount = parseFloat(newSale.discount);
      const finalAmount = amount - discount;

      const { error } = await supabase
        .from('sales')
        .insert({
          school_id: school.id,
          student_id: newSale.student_id || null,
          description: newSale.description,
          amount: amount,
          discount: discount,
          final_amount: finalAmount,
          payment_method: newSale.payment_method,
          status: 'completed',
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Venda registrada!",
        description: `Venda de R$ ${finalAmount.toFixed(2)} concluída`
      });

      setDialogOpen(false);
      setNewSale({ description: '', amount: '', discount: '0', payment_method: 'cash', student_id: '' });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao registrar venda",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      completed: 'success',
      pending: 'default',
      cancelled: 'destructive'
    };
    const labels: any = {
      completed: 'Concluída',
      pending: 'Pendente',
      cancelled: 'Cancelada'
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const totalSales = sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.final_amount, 0);
  const totalDiscount = sales.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.discount, 0);
  const salesCount = sales.filter(s => s.status === 'completed').length;

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vendas</h1>
          <p className="text-muted-foreground">Gestão de vendas e produtos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Venda
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Venda</DialogTitle>
              <DialogDescription>Registre uma nova venda</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Cliente (Opcional)</Label>
                <Select value={newSale.student_id} onValueChange={(value) => setNewSale({...newSale, student_id: value})}>
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
                  value={newSale.description}
                  onChange={(e) => setNewSale({...newSale, description: e.target.value})}
                  placeholder="Ex: Uniforme, Material, Aula avulsa..."
                />
              </div>
              <div>
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newSale.amount}
                  onChange={(e) => setNewSale({...newSale, amount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Desconto</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={newSale.discount}
                  onChange={(e) => setNewSale({...newSale, discount: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Método de Pagamento</Label>
                <Select value={newSale.payment_method} onValueChange={(value) => setNewSale({...newSale, payment_method: value})}>
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
              {newSale.amount && (
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Valor Final</p>
                  <p className="text-2xl font-bold">
                    R$ {(parseFloat(newSale.amount) - parseFloat(newSale.discount || '0')).toFixed(2)}
                  </p>
                </div>
              )}
              <Button onClick={handleCreate} className="w-full">Registrar Venda</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Recebido</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {totalSales.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quantidade</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Descontos</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">R$ {totalDiscount.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de Vendas</CardTitle>
          <CardDescription>Lista de todas as vendas realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Método</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Desconto</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id}>
                  <TableCell>{format(new Date(sale.sale_date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  <TableCell>{sale.student?.full_name || '-'}</TableCell>
                  <TableCell className="font-medium">{sale.description}</TableCell>
                  <TableCell className="capitalize">{sale.payment_method}</TableCell>
                  <TableCell className="text-right">R$ {sale.amount.toFixed(2)}</TableCell>
                  <TableCell className="text-right text-orange-600">- R$ {sale.discount.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-bold">R$ {sale.final_amount.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(sale.status)}</TableCell>
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


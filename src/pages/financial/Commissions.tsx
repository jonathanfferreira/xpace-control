import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Users, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Commission {
  id: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  payment_date: string | null;
  reference_month: string;
  sale: {
    description: string;
    final_amount: number;
  } | null;
  teacher: {
    full_name: string;
  } | null;
}

export default function Commissions() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCommissions();
  }, []);

  const fetchCommissions = async () => {
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
        .from('commissions')
        .select(`
          *,
          sale:sales(description, final_amount),
          teacher:profiles!commissions_teacher_id_fkey(full_name)
        `)
        .eq('school_id', school.id)
        .order('reference_month', { ascending: false });

      if (error) throw error;
      setCommissions(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar comissões",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (id: string, amount: number) => {
    try {
      const { error } = await supabase
        .from('commissions')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Comissão paga!",
        description: `R$ ${amount.toFixed(2)} pago com sucesso`
      });

      fetchCommissions();
    } catch (error: any) {
      toast({
        title: "Erro ao pagar comissão",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      pending: 'default',
      paid: 'success',
      cancelled: 'destructive'
    };
    const labels: any = {
      pending: 'Pendente',
      paid: 'Pago',
      cancelled: 'Cancelado'
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  const totalPending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0);
  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0);
  const uniqueTeachers = new Set(commissions.map(c => c.teacher?.full_name)).size;

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Comissões</h1>
          <p className="text-muted-foreground">Gestão de comissões de professores e vendedores</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pago</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ {totalPaid.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">R$ {totalPending.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Professores</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueTeachers}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Comissões</CardTitle>
          <CardDescription>Lista de todas as comissões</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Professor</TableHead>
                <TableHead>Referência</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Valor da Venda</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Comissão</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commissions.map((commission) => (
                <TableRow key={commission.id}>
                  <TableCell className="font-medium">{commission.teacher?.full_name || '-'}</TableCell>
                  <TableCell>{format(new Date(commission.reference_month), "MM/yyyy", { locale: ptBR })}</TableCell>
                  <TableCell>{commission.sale?.description || '-'}</TableCell>
                  <TableCell>R$ {commission.sale?.final_amount.toFixed(2) || '0.00'}</TableCell>
                  <TableCell>
                    {commission.payment_date 
                      ? format(new Date(commission.payment_date), "dd/MM/yyyy", { locale: ptBR })
                      : '-'
                    }
                  </TableCell>
                  <TableCell>{getStatusBadge(commission.status)}</TableCell>
                  <TableCell className="text-right font-bold">R$ {commission.amount.toFixed(2)}</TableCell>
                  <TableCell>
                    {commission.status === 'pending' && (
                      <Button size="sm" onClick={() => handleMarkAsPaid(commission.id, commission.amount)}>
                        Pagar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {commissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Nenhuma comissão registrada
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
    </DashboardLayout>
  );
}


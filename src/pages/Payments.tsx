import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CreditCard, CheckCircle, AlertCircle, Clock, Plus } from "lucide-react";
import { PaymentService } from "@/services/payment/PaymentService";
import type { Database } from "@/integrations/supabase/types";

type Payment = Database["public"]["Tables"]["payments"]["Row"] & {
  students?: { full_name: string };
};

type Student = Database["public"]["Tables"]["students"]["Row"];

export default function Payments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentProvider, setPaymentProvider] = useState<"MOCK" | "ASAAS_SANDBOX">("MOCK");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newPayment, setNewPayment] = useState({
    student_id: "",
    amount: "",
    due_date: "",
    reference_month: "",
  });

  useEffect(() => {
    checkAuth();
    fetchPayments();
    fetchStudents();
    fetchSchoolSettings();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          students(full_name)
        `)
        .order("due_date", { ascending: false });

      if (error) throw error;
      setPayments(data || []);
      applyFilters(data || [], statusFilter);
    } catch (error: any) {
      toast.error("Erro ao carregar pagamentos");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (paymentsData: Payment[], filter: string) => {
    let filtered = paymentsData;

    if (filter !== "all") {
      if (filter === "overdue") {
        filtered = paymentsData.filter((p) => {
          if (p.status === "paid") return false;
          return new Date() > new Date(p.due_date);
        });
      } else {
        filtered = paymentsData.filter((p) => p.status === filter);
      }
    }

    setFilteredPayments(filtered);
  };

  useEffect(() => {
    applyFilters(payments, statusFilter);
  }, [statusFilter, payments]);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("active", true)
        .order("full_name");

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar alunos:", error);
    }
  };

  const fetchSchoolSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("schools")
        .select("payment_provider")
        .eq("admin_id", user.id)
        .single();

      if (error) throw error;
      if (data?.payment_provider) {
        setPaymentProvider(data.payment_provider as "MOCK" | "ASAAS_SANDBOX");
      }
    } catch (error: any) {
      console.error("Erro ao carregar configurações:", error);
    }
  };

  const handleCreatePayment = async () => {
    try {
      if (!newPayment.student_id || !newPayment.amount || !newPayment.due_date || !newPayment.reference_month) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }

      const paymentService = new PaymentService(paymentProvider);
      
      // Create charge via payment provider
      const charge = await paymentService.criarCobranca(
        newPayment.student_id,
        parseFloat(newPayment.amount),
        newPayment.due_date,
        `Mensalidade - ${new Date(newPayment.reference_month).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`
      );

      // Save to database
      const { error } = await supabase
        .from("payments")
        .insert({
          student_id: newPayment.student_id,
          amount: parseFloat(newPayment.amount),
          due_date: newPayment.due_date,
          reference_month: newPayment.reference_month,
          payment_reference: charge.externalReference,
          status: "pending",
        });

      if (error) throw error;

      toast.success("Cobrança criada com sucesso!");
      setIsCreateDialogOpen(false);
      setNewPayment({ student_id: "", amount: "", due_date: "", reference_month: "" });
      fetchPayments();
    } catch (error: any) {
      toast.error("Erro ao criar cobrança: " + error.message);
    }
  };

  const handleMarkAsPaid = async (paymentId: string, paymentReference?: string) => {
    try {
      const paidDate = new Date().toISOString().split("T")[0];
      
      // If there's a payment reference, mark as paid via provider
      if (paymentReference) {
        const paymentService = new PaymentService(paymentProvider);
        await paymentService.marcarPago(paymentReference, paidDate, "pix");
      }

      const { error } = await supabase
        .from("payments")
        .update({
          status: "paid",
          paid_date: paidDate,
          payment_method: "pix",
        })
        .eq("id", paymentId);

      if (error) throw error;

      toast.success("Pagamento confirmado!");
      fetchPayments();
    } catch (error: any) {
      toast.error("Erro ao confirmar pagamento");
    }
  };

  const getStatusBadge = (payment: Payment) => {
    const today = new Date();
    const dueDate = new Date(payment.due_date);

    if (payment.status === "paid") {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Pago
        </Badge>
      );
    }

    if (today > dueDate) {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Atrasado
        </Badge>
      );
    }

    return (
      <Badge variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        Pendente
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate statistics
  const paidTotal = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingTotal = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const overdueCount = payments.filter((p) => {
    if (p.status === "paid") return false;
    return new Date() > new Date(p.due_date);
  }).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Pagamentos</h1>
          <p className="text-muted-foreground">Gerencie os pagamentos dos alunos</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pagos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(paidTotal)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(pendingTotal)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Atrasados</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Payments List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Lista de Pagamentos
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="paid">Pagos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="overdue">Atrasados</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gradient-xpace">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Cobrança
                    </Button>
                  </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Nova Cobrança</DialogTitle>
                    <DialogDescription>
                      Crie uma cobrança para um aluno. O sistema usará o gateway{" "}
                      <strong>{paymentProvider === "MOCK" ? "MOCK (Teste)" : "ASAAS Sandbox"}</strong>.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>Aluno</Label>
                      <Select
                        value={newPayment.student_id}
                        onValueChange={(value) => setNewPayment({ ...newPayment, student_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um aluno" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Valor (R$)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newPayment.amount}
                        onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Mês de Referência</Label>
                      <Input
                        type="month"
                        value={newPayment.reference_month}
                        onChange={(e) => setNewPayment({ ...newPayment, reference_month: e.target.value + "-01" })}
                      />
                    </div>
                    <div>
                      <Label>Vencimento</Label>
                      <Input
                        type="date"
                        value={newPayment.due_date}
                        onChange={(e) => setNewPayment({ ...newPayment, due_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleCreatePayment} className="gradient-xpace">
                      Criar Cobrança
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{payment.students?.full_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Referência: {new Date(payment.reference_month).toLocaleDateString("pt-BR", {
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Vencimento: {new Date(payment.due_date).toLocaleDateString("pt-BR")}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(Number(payment.amount))}
                        </p>
                        {getStatusBadge(payment)}
                      </div>

                      {payment.status !== "paid" && (
                        <Button
                          onClick={() => handleMarkAsPaid(payment.id, payment.payment_reference || undefined)}
                          variant="outline"
                          size="sm"
                          className="whitespace-nowrap"
                        >
                          Marcar como Pago
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum pagamento registrado
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

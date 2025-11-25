import { GuardianLayout } from '@/components/layout/GuardianLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { db } from '@/integrations/firebase/client';
import { collection, query, where, getDocs, doc, getDoc, orderBy } from 'firebase/firestore';
import { DollarSign, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface Payment {
  id: string;
  amount: number;
  due_date: string;
  paid_date?: string;
  status: string;
  payment_method?: string;
  reference_month: string;
}

export default function GuardianPayments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const studentId = params.get('student');
      
      if (!studentId) return;

      // Buscar nome do aluno
      const studentDocRef = doc(db, "students", studentId);
      const studentDocSnap = await getDoc(studentDocRef);

      if (studentDocSnap.exists()) {
        setStudentName(studentDocSnap.data().full_name);
      }

      // Buscar pagamentos
      const paymentsCollectionRef = collection(db, "payments");
      const q = query(paymentsCollectionRef, where("student_id", "==", studentId), orderBy("due_date", "desc"));
      
      const querySnapshot = await getDocs(q);
      
      const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os pagamentos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'overdue':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500">Pago</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pendente</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Atrasado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <GuardianLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Carregando...</div>
        </div>
      </GuardianLayout>
    );
  }

  return (
    <GuardianLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Pagamentos</h1>
          <p className="text-muted-foreground">{studentName}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Histórico de Pagamentos
            </CardTitle>
            <CardDescription>
              {payments.length} pagamentos registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum pagamento registrado ainda.
              </p>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div 
                    key={payment.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                  >
                    <div className="rounded-full bg-background p-2">
                      {getStatusIcon(payment.status)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold text-foreground">
                          {format(new Date(payment.reference_month), 'MMMM yyyy', { locale: ptBR })}
                        </div>
                        {getStatusBadge(payment.status)}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Valor: <span className="font-semibold text-foreground">R$ {payment.amount.toFixed(2)}</span></div>
                        <div>Vencimento: {format(new Date(payment.due_date), "dd/MM/yyyy")}</div>
                        {payment.paid_date && (
                          <div>Pago em: {format(new Date(payment.paid_date), "dd/MM/yyyy")}</div>
                        )}
                        {payment.payment_method && (
                          <div>Método: {payment.payment_method}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </GuardianLayout>
  );
}

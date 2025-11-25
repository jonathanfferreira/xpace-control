import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { DollarSign, Users, CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

interface Commission {
  id: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  payment_date: any | null;
  reference_month: any;
  sale_id: string;
  teacher_id: string;
  sale?: { description: string; final_amount: number };
  teacher?: { full_name: string };
}

export default function Commissions() {
  const { user } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchCommissions();
  }, [user]);

  const getSchoolId = async () => {
    if (!user) return null;
    const q = query(collection(db, "schools"), where("admin_id", "==", user.uid));
    const schoolSnap = await getDocs(q);
    return schoolSnap.empty ? null : schoolSnap.docs[0].id;
  }

  const fetchCommissions = async () => {
    setLoading(true);
    try {
      const schoolId = await getSchoolId();
      if (!schoolId) {
        setCommissions([]);
        return;
      }

      const commsQuery = query(collection(db, 'commissions'), where('school_id', '==', schoolId));
      const commsSnap = await getDocs(commsQuery);
      const commsList = commsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Commission));

      // Batch fetch related data
      const teacherIds = [...new Set(commsList.map(c => c.teacher_id))];
      const saleIds = [...new Set(commsList.map(c => c.sale_id))];

      const teachersData: Record<string, any> = {};
      if (teacherIds.length > 0) {
        const teachersQuery = query(collection(db, 'profiles'), where('id', 'in', teacherIds));
        const teachersSnap = await getDocs(teachersQuery);
        teachersSnap.forEach(doc => teachersData[doc.id] = doc.data());
      }

      const salesData: Record<string, any> = {};
      if (saleIds.length > 0) {
        const salesQuery = query(collection(db, 'sales'), where('id', 'in', saleIds));
        const salesSnap = await getDocs(salesQuery);
        salesSnap.forEach(doc => salesData[doc.id] = doc.data());
      }
      
      const enrichedCommissions = commsList.map(comm => ({
        ...comm,
        teacher: teachersData[comm.teacher_id] ? { full_name: teachersData[comm.teacher_id].full_name } : { full_name: '-' },
        sale: salesData[comm.sale_id]
      }));

      setCommissions(enrichedCommissions);

    } catch (error: any) {
      toast.error("Erro ao carregar comissões", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = async (id: string, amount: number) => {
    try {
      await updateDoc(doc(db, 'commissions', id), {
        status: 'paid',
        payment_date: serverTimestamp()
      });
      toast.success("Comissão paga!", { description: `R$ ${amount.toFixed(2)} pago com sucesso` });
      fetchCommissions();
    } catch (error: any) {
      toast.error("Erro ao pagar comissão", { description: error.message });
    }
  };

  const formatDate = (timestamp: any) => timestamp ? format(timestamp.toDate(), "dd/MM/yyyy", { locale: ptBR }) : '-';
  const formatMonth = (timestamp: any) => timestamp ? format(timestamp.toDate(), "MM/yyyy", { locale: ptBR }) : '-';

  // UI remains largely the same, but uses the new data structure and formatDate helper
  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Comissões</h1>
         {/* Summary Cards */}

        <Card>
          <CardHeader><CardTitle>Lista de Comissões</CardTitle></CardHeader>
          <CardContent>
            <Table>
                <TableHeader> 
                    {/* Table Headers */}
                </TableHeader>
                <TableBody>
                {commissions.map((commission) => (
                    <TableRow key={commission.id}>
                        <TableCell>{commission.teacher?.full_name}</TableCell>
                        <TableCell>{formatMonth(commission.reference_month)}</TableCell>
                        <TableCell>{commission.sale?.description || '-'}</TableCell>
                        <TableCell>R$ {commission.sale?.final_amount?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>{formatDate(commission.payment_date)}</TableCell>
                        <TableCell><Badge>{commission.status}</Badge></TableCell>
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
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

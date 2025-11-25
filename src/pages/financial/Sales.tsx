import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

interface Sale {
  id: string;
  description: string;
  amount: number;
  discount: number;
  final_amount: number;
  payment_method: string;
  status: 'completed' | 'pending' | 'cancelled';
  sale_date: any;
  student_id: string | null;
  student?: { full_name: string };
}

export default function Sales() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [newSale, setNewSale] = useState({
    description: '',
    amount: '',
    discount: '0',
    payment_method: 'cash',
    student_id: ''
  });

  useEffect(() => {
    if(user) fetchData();
  }, [user]);

  const getSchoolId = async () => {
    if (!user) return null;
    const q = query(collection(db, "schools"), where("admin_id", "==", user.uid));
    const schoolSnap = await getDocs(q);
    return schoolSnap.empty ? null : schoolSnap.docs[0].id;
  }

  const fetchData = async () => {
    setLoading(true);
    try {
      const schoolId = await getSchoolId();
      if (!schoolId) return;

      const [salesSnap, studentsSnap] = await Promise.all([
        getDocs(query(collection(db, 'sales'), where('school_id', '==', schoolId))),
        getDocs(query(collection(db, 'students'), where('school_id', '==', schoolId), where('active', '==', true)))
      ]);

      const studentMap = new Map(studentsSnap.docs.map(doc => [doc.id, doc.data()]));
      const salesList = salesSnap.docs.map(doc => {
        const sale = { id: doc.id, ...doc.data() } as Sale;
        if (sale.student_id && studentMap.has(sale.student_id)) {
          sale.student = { full_name: studentMap.get(sale.student_id).full_name };
        }
        return sale;
      });

      setSales(salesList);
      setStudents(studentsSnap.docs.map(d => ({id: d.id, ...d.data()})));

    } catch (error: any) {
      toast.error("Erro ao carregar dados", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const schoolId = await getSchoolId();
    if (!schoolId || !newSale.description || !newSale.amount) {
        toast.error("Descrição e valor são obrigatórios.");
        return;
    }

    try {
        const amount = parseFloat(newSale.amount);
        const discount = parseFloat(newSale.discount || '0');

        await addDoc(collection(db, 'sales'), {
            school_id: schoolId,
            student_id: newSale.student_id || null,
            description: newSale.description,
            amount,
            discount,
            final_amount: amount - discount,
            payment_method: newSale.payment_method,
            status: 'completed',
            sale_date: serverTimestamp(),
            created_by: user?.uid
        });

        toast.success("Venda registrada com sucesso!");
        setDialogOpen(false);
        fetchData(); // Refresh
    } catch (error: any) {
        toast.error("Erro ao registrar venda", { description: error.message });
    }
  };

  // UI and helper functions remain similar. 
  // Remember to use a helper to format Firestore Timestamps, e.g., format(sale.sale_date.toDate(), ...)

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
      <DashboardLayout>
          <div className="space-y-6">
              <h1 className="text-3xl font-bold">Vendas</h1>
              {/* Dialog and other components */}
          </div>
      </DashboardLayout>
  );
}

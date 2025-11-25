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
import { Plus, DollarSign, AlertCircle, CheckCircle, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

interface AccountReceivable {
  id: string;
  description: string;
  amount: number;
  due_date: any;
  payment_date: any | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  student_id: string;
  student?: { full_name: string };
  revenue_category_id: string;
  revenue_category?: { name: string };
  installment_number: number;
  total_installments: number;
}

export default function AccountsReceivable() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AccountReceivable[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [newAccount, setNewAccount] = useState({
    description: '',
    amount: '',
    due_date: '',
    student_id: '',
    revenue_category_id: '',
    installments: '1'
  });

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const getSchoolId = async () => {
    if (!user) return null;
    const q = query(collection(db, "schools"), where("admin_id", "==", user.uid));
    const snapshot = await getDocs(q);
    return snapshot.empty ? null : snapshot.docs[0].id;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const schoolId = await getSchoolId();
      if (!schoolId) return;

      const [accountsSnap, studentsSnap, categoriesSnap] = await Promise.all([
        getDocs(query(collection(db, 'accounts_receivable'), where('school_id', '==', schoolId))),
        getDocs(query(collection(db, 'students'), where('school_id', '==', schoolId), where('active', '==', true))),
        getDocs(query(collection(db, 'revenue_categories'), where('school_id', '==', schoolId)))
      ]);

      const studentCache = new Map(studentsSnap.docs.map(doc => [doc.id, doc.data()]));

      const accountsList = await Promise.all(accountsSnap.docs.map(async docSnap => {
        const account = { id: docSnap.id, ...docSnap.data() } as AccountReceivable;
        account.student = { full_name: studentCache.get(account.student_id)?.full_name || '-' };
        // Similar logic for categories if needed
        return account;
      }));

      setAccounts(accountsList);
      setStudents(studentsSnap.docs.map(d => ({id: d.id, ...d.data()})));
      setCategories(categoriesSnap.docs.map(d => ({id: d.id, ...d.data()})));

    } catch (error: any) {
      toast.error("Erro ao carregar dados", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const schoolId = await getSchoolId();
    if (!schoolId || !newAccount.student_id) {
      toast.error("Aluno e escola são obrigatórios");
      return;
    }

    try {
      const batch = writeBatch(db);
      const totalInstallments = parseInt(newAccount.installments);
      const installmentAmount = parseFloat(newAccount.amount) / totalInstallments;
      const baseDate = new Date(newAccount.due_date + 'T00:00:00'); // Avoid timezone issues

      for (let i = 0; i < totalInstallments; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        const newDocRef = doc(collection(db, "accounts_receivable"));

        batch.set(newDocRef, {
          school_id: schoolId,
          student_id: newAccount.student_id,
          revenue_category_id: newAccount.revenue_category_id || null,
          description: `${newAccount.description} (${i + 1}/${totalInstallments})`,
          amount: installmentAmount,
          due_date: dueDate,
          installment_number: i + 1,
          total_installments: totalInstallments,
          status: 'pending',
          created_at: serverTimestamp()
        });
      }
      
      await batch.commit();

      toast.success("Conta criada com sucesso!", {
        description: `${totalInstallments}x de R$ ${installmentAmount.toFixed(2)}`
      });

      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao criar conta", { description: error.message });
    }
  };

  const handleMarkAsReceived = async (id: string) => {
    try {
      await updateDoc(doc(db, 'accounts_receivable', id), {
        status: 'paid',
        payment_date: serverTimestamp()
      });
      toast.success("Recebimento registrado!");
      fetchData();
    } catch (error: any) {
      toast.error("Erro ao registrar recebimento", { description: error.message });
    }
  };
  
  // UI and helper functions remain similar, adapt date formatting for Firestore Timestamps
  const formatDate = (timestamp: any) => {
    if (timestamp && timestamp.toDate) {
      return format(timestamp.toDate(), "dd/MM/yyyy", { locale: ptBR });
    }
    return '-';
  };


  return <DashboardLayout><div>UI for Accounts Receivable</div></DashboardLayout>;
}

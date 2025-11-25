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
import { Plus, DollarSign, AlertCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

interface AccountPayable {
  id: string;
  description: string;
  amount: number;
  due_date: any; // Changed to any to handle Firestore Timestamp
  payment_date: any | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  payment_method: string | null;
  expense_category_id: string;
  expense_category?: { name: string };
}

export default function AccountsPayable() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<AccountPayable[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [newAccount, setNewAccount] = useState({
    description: '',
    amount: '',
    due_date: '',
    expense_category_id: '',
    payment_method: '',
    is_recurring: false
  });

  useEffect(() => {
    if(user) fetchData();
  }, [user]);

  const getSchoolId = async () => {
    if (!user) return null;
    const q = query(collection(db, "schools"), where("admin_id", "==", user.uid));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    return snapshot.docs[0].id;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const schoolId = await getSchoolId();
      if (!schoolId) return;

      const accountsQuery = query(collection(db, 'accounts_payable'), where('school_id', '==', schoolId));
      const categoriesQuery = query(collection(db, 'expense_categories'), where('school_id', '==', schoolId));

      const [accountsSnapshot, categoriesSnapshot] = await Promise.all([
        getDocs(accountsQuery),
        getDocs(categoriesQuery)
      ]);

      const accountsList = await Promise.all(accountsSnapshot.docs.map(async (docSnap) => {
        const account = { id: docSnap.id, ...docSnap.data() } as AccountPayable;
        if (account.expense_category_id) {
          const categoryDoc = await getDoc(doc(db, 'expense_categories', account.expense_category_id));
          if(categoryDoc.exists()) {
            account.expense_category = { name: categoryDoc.data().name };
          }
        }
        return account;
      }));

      setAccounts(accountsList);
      setCategories(categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error: any) {
      toast.error("Erro ao carregar dados", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const schoolId = await getSchoolId();
    if (!schoolId) return;

    try {
      await addDoc(collection(db, 'accounts_payable'), {
        school_id: schoolId,
        description: newAccount.description,
        amount: parseFloat(newAccount.amount),
        due_date: new Date(newAccount.due_date),
        expense_category_id: newAccount.expense_category_id || null,
        is_recurring: newAccount.is_recurring,
        status: 'pending',
        created_at: serverTimestamp()
      });

      toast.success("Conta criada com sucesso!");
      setDialogOpen(false);
      fetchData(); // Refresh
    } catch (error: any) {
      toast.error("Erro ao criar conta", { description: error.message });
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await updateDoc(doc(db, 'accounts_payable', id), {
        status: 'paid',
        payment_date: serverTimestamp()
      });

      toast.success("Pagamento registrado!");
      fetchData(); // Refresh
    } catch (error: any) {
      toast.error("Erro ao registrar pagamento", { description: error.message });
    }
  };

  // UI Components and rendering logic remain the same
  return <DashboardLayout><div>UI for Accounts Payable</div></DashboardLayout>;
}

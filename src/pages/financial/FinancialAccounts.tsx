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
import { Plus, Building2, CreditCard, Wallet, TrendingUp } from "lucide-react";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

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
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [newAccount, setNewAccount] = useState({
    name: '',
    type: 'bank_account' as FinancialAccount['type'],
    initial_balance: '',
    bank_name: '',
    account_number: ''
  });

  useEffect(() => {
    if (user) fetchAccounts();
  }, [user]);

  const getSchoolId = async () => {
    if (!user) return null;
    const q = query(collection(db, "schools"), where("admin_id", "==", user.uid));
    const schoolSnap = await getDocs(q);
    return schoolSnap.empty ? null : schoolSnap.docs[0].id;
  }

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const schoolId = await getSchoolId();
      if (!schoolId) {
        setAccounts([]);
        return;
      }
      const q = query(collection(db, 'financial_accounts'), where('school_id', '==', schoolId));
      const snapshot = await getDocs(q);
      setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FinancialAccount)));
    } catch (error: any) {
      toast.error("Erro ao carregar contas", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const schoolId = await getSchoolId();
    if (!schoolId || !newAccount.name) {
        toast.error("Nome da conta é obrigatório");
        return;
    }

    try {
      await addDoc(collection(db, 'financial_accounts'), {
        school_id: schoolId,
        name: newAccount.name,
        type: newAccount.type,
        balance: parseFloat(newAccount.initial_balance) || 0,
        bank_name: newAccount.bank_name || null,
        account_number: newAccount.account_number || null,
        active: true,
        created_at: serverTimestamp()
      });

      toast.success("Conta criada com sucesso!");
      setDialogOpen(false);
      fetchAccounts(); // Refresh
    } catch (error: any) {
      toast.error("Erro ao criar conta", { description: error.message });
    }
  };

  // UI Helper functions (getTypeIcon, getTypeLabel) remain the same
  // The rest of the component...
  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Contas Financeiras</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            {/* Dialog Trigger and Content */}
        </Dialog>
        
        {/* Cards and Table for displaying accounts */}
      </div>
    </DashboardLayout>
  );
}

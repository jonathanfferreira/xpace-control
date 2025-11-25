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
import { DollarSign, Plus, X, ArrowDownCircle, ArrowUpCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { collection, query, where, getDocs, addDoc, updateDoc, doc, serverTimestamp, orderBy, limit } from 'firebase/firestore';

// Interfaces adaptadas para Firestore
interface CashRegister {
  id: string;
  opening_date: any;
  closing_date: any | null;
  opening_balance: number;
  closing_balance: number | null;
  status: 'open' | 'closed';
  financial_account_id: string;
  financial_account?: { name: string };
}

interface Transaction {
  id: string;
  type: 'entry' | 'exit';
  amount: number;
  payment_method: string;
  description: string;
  created_at: any;
}

export default function CashRegisterPage() {
  const { user } = useAuth();
  const [currentRegister, setCurrentRegister] = useState<CashRegister | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({ type: 'entry' as 'entry' | 'exit', amount: '', payment_method: 'cash', description: '' });

  useEffect(() => {
    if (user) fetchCurrentCashRegister();
  }, [user]);

  const getSchoolId = async () => {
    if (!user) return null;
    const q = query(collection(db, "schools"), where("admin_id", "==", user.uid));
    const schoolSnap = await getDocs(q);
    return schoolSnap.empty ? null : schoolSnap.docs[0].id;
  }

  const fetchCurrentCashRegister = async () => {
    setLoading(true);
    try {
      const schoolId = await getSchoolId();
      if (!schoolId) return;

      const q = query(
        collection(db, "cash_registers"),
        where("school_id", "==", schoolId),
        where("status", "==", "open"),
        orderBy("opening_date", "desc"),
        limit(1)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const register = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as CashRegister;
        setCurrentRegister(register);
        fetchTransactions(register.id);
      } else {
        setCurrentRegister(null);
      }
    } catch (e: any) { toast.error("Erro ao buscar caixa", { description: e.message });
    } finally { setLoading(false); }
  };

  const fetchTransactions = async (registerId: string) => {
    const transQuery = query(collection(db, "cash_register_transactions"), where("cash_register_id", "==", registerId), orderBy("created_at", "desc"));
    const transSnap = await getDocs(transQuery);
    setTransactions(transSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
  };

  const handleAddTransaction = async () => {
    if (!currentRegister || !newTransaction.amount) return;
    try {
      await addDoc(collection(db, "cash_register_transactions"), {
        cash_register_id: currentRegister.id,
        type: newTransaction.type,
        amount: parseFloat(newTransaction.amount),
        payment_method: newTransaction.payment_method,
        description: newTransaction.description,
        created_at: serverTimestamp(),
        created_by: user?.uid,
        source: 'manual'
      });
      toast.success("Transação adicionada!");
      setDialogOpen(false);
      fetchTransactions(currentRegister.id);
    } catch (e: any) { toast.error("Erro ao adicionar transação", { description: e.message }); }
  };
  
  // Render logic needs to be adapted for one open register at a time.
  // Simplified rendering...
  if (loading) return <div>Carregando...</div>;

  return (
    <DashboardLayout>
        <div>
            <h1 className="text-3xl font-bold">Caixa</h1>
            {currentRegister ? (
                <div>
                    <p>Caixa aberto em: {format(currentRegister.opening_date.toDate(), 'PPPpp', {locale: ptBR})}</p>
                    <Button onClick={() => setDialogOpen(true)}>Nova Transação</Button>
                    {/* Transaction list, summary cards etc. */}
                </div>
            ) : (
                <p>Nenhum caixa aberto.</p>
                // Button to open a new cash register
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova Transação</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {/* Form fields for new transaction */}
                        <Input placeholder="Valor" type="number" value={newTransaction.amount} onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})}/>
                        <Input placeholder="Descrição" value={newTransaction.description} onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}/>
                        <Button onClick={handleAddTransaction}>Adicionar</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    </DashboardLayout>
  );
}


import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SchoolPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  frequency: 'monthly' | 'quarterly' | 'yearly' | 'single';
}

const emptyPlan: Omit<SchoolPlan, 'id'> = {
  name: '',
  description: '',
  price: 0,
  frequency: 'monthly',
};

export default function SchoolPlansPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SchoolPlan[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SchoolPlan | null>(null);
  const [formData, setFormData] = useState<Omit<SchoolPlan, 'id'>>(emptyPlan);
  
  useEffect(() => {
    if (user) {
      fetchPlans();
    }
  }, [user]);

  const fetchPlans = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const schoolQuery = query(collection(db, 'schools'), where('admin_id', '==', user.uid));
      const schoolSnapshot = await getDocs(schoolQuery);
      if (schoolSnapshot.empty) {
          toast.error("Nenhuma escola encontrada para seu usuário.");
          setLoading(false);
          return;
      }
      const schoolId = schoolSnapshot.docs[0].id;

      const plansQuery = query(collection(db, 'school_plans'), where('school_id', '==', schoolId));
      const querySnapshot = await getDocs(plansQuery);
      const fetchedPlans = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SchoolPlan));
      setPlans(fetchedPlans);
    } catch (error: any) {
      toast.error('Erro ao carregar planos:', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (plan: SchoolPlan | null = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData(plan);
    } else {
      setEditingPlan(null);
      setFormData(emptyPlan);
    }
    setIsDialogOpen(true);
  };

  const handleSavePlan = async () => {
    if (!user) return;
    if (!formData.name || formData.price <= 0) {
        toast.warning("Nome e preço (maior que zero) são obrigatórios.");
        return;
    }

    try {
        const schoolQuery = query(collection(db, 'schools'), where('admin_id', '==', user.uid));
        const schoolSnapshot = await getDocs(schoolQuery);
        const schoolId = schoolSnapshot.docs[0].id;

        const planData = { ...formData, price: Number(formData.price), school_id: schoolId };

        if (editingPlan) {
            const planRef = doc(db, 'school_plans', editingPlan.id);
            await updateDoc(planRef, { ...planData, updatedAt: serverTimestamp() });
            toast.success('Plano atualizado com sucesso!');
        } else {
            await addDoc(collection(db, 'school_plans'), { ...planData, createdAt: serverTimestamp() });
            toast.success('Plano criado com sucesso!');
        }
        fetchPlans();
        setIsDialogOpen(false);
    } catch (error: any) {
        toast.error('Erro ao salvar plano:', { description: error.message });
    }
  };

  const handleDeletePlan = async (planId: string) => {
      if(!confirm("Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.")) return;

      try {
          await deleteDoc(doc(db, 'school_plans', planId));
          toast.success("Plano excluído com sucesso!");
          fetchPlans();
      } catch (error: any) {
          toast.error("Erro ao excluir plano:", { description: error.message });
      }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, frequency: value as SchoolPlan['frequency'] }));
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Planos da Escola</h1>
            <p className="text-muted-foreground">Gerencie os planos de assinatura oferecidos aos seus alunos.</p>
          </div>
          <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Criar Novo Plano</Button>
        </div>

        <Card>
          <CardContent className='pt-6'>
            {loading ? (
              <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome do Plano</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.length > 0 ? plans.map(plan => (
                    <TableRow key={plan.id}>
                      <TableCell className="font-medium">{plan.name}</TableCell>
                      <TableCell>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(plan.price)}</TableCell>
                      <TableCell className='capitalize'>{plan.frequency}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(plan)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeletePlan(plan.id)}><Trash className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow><TableCell colSpan={4} className="text-center h-24">Nenhum plano cadastrado ainda.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}</DialogTitle>
                    <DialogDescription>Preencha os detalhes do plano.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">Nome</Label>
                        <Input id="name" name="name" value={formData.name} onChange={handleInputChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="description" className="text-right">Descrição</Label>
                        <Input id="description" name="description" value={formData.description} onChange={handleInputChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">Preço (R$)</Label>
                        <Input id="price" name="price" type="number" value={formData.price} onChange={handleInputChange} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="frequency" className="text-right">Frequência</Label>
                        <Select name="frequency" value={formData.frequency} onValueChange={handleSelectChange}>
                            <SelectTrigger className="col-span-3"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="monthly">Mensal</SelectItem>
                                <SelectItem value="quarterly">Trimestral</SelectItem>
                                <SelectItem value="yearly">Anual</SelectItem>
                                <SelectItem value="single">Aula Única</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                    <Button onClick={handleSavePlan}>Salvar Plano</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

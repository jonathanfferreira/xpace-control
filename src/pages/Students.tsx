
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUnit } from '@/contexts/UnitContext';
import { toast } from 'sonner';
import { Plus, Search, Pencil, Trash2, Loader2 } from 'lucide-react';
import { studentSchema, type StudentFormData } from '@/lib/validations';
import { useSubscription } from '@/hooks/useSubscription';
import { SubscriptionLimitWarning } from '@/components/SubscriptionLimitWarning';
import { UpgradeModal } from '@/components/UpgradeModal';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, serverTimestamp } from 'firebase/firestore';

export default function Students() {
  const { user } = useAuth();
  const { selectedUnit } = useUnit();
  const { subscription, canAddStudent, loading: subLoading } = useSubscription();
  const navigate = useNavigate();

  const [students, setStudents] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [formData, setFormData] = useState<StudentFormData>({
    full_name: '',
    email: '',
    phone: '',
    birth_date: '',
    emergency_contact: '',
    emergency_phone: '',
    unit_id: null,
    active: true,
  });

  const schoolId = useMemo(async () => {
    if (!user) return null;
    const schoolQuery = query(collection(db, 'schools'), where('admin_id', '==', user.uid));
    const schoolSnapshot = await getDocs(schoolQuery);
    if (schoolSnapshot.empty) return null;
    return schoolSnapshot.docs[0].id;
  }, [user]);

  const fetchStudents = async () => {
    if (!user || !schoolId) return;
    setLoading(true);
    try {
      const resolvedSchoolId = await schoolId;
      if (!resolvedSchoolId) throw new Error("Escola não encontrada");

      let q = query(collection(db, 'students'), where('school_id', '==', resolvedSchoolId));
      if (selectedUnit) {
        q = query(q, where('unit_id', '==', selectedUnit.id));
      }
      const querySnapshot = await getDocs(q);
      const studentsList = await Promise.all(querySnapshot.docs.map(async (doc) => {
          const studentData = doc.data();
          let unitName = '-';
          if (studentData.unit_id) {
              const unitDocRef = doc(db, 'school_units', studentData.unit_id);
              const unitDoc = await getDoc(unitDocRef);
              if (unitDoc.exists()) {
                  unitName = unitDoc.data().name;
              }
          }
          return { id: doc.id, ...studentData, unit_name: unitName };
      }));
      setStudents(studentsList);
    } catch (error: any) {
      toast.error('Erro ao carregar alunos', { description: error.message });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUnits = async () => {
      if (!user || !schoolId) return;
      try {
          const resolvedSchoolId = await schoolId;
          if (!resolvedSchoolId) return;
          const q = query(collection(db, 'school_units'), where('school_id', '==', resolvedSchoolId));
          const querySnapshot = await getDocs(q);
          const unitsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setUnits(unitsList);
      } catch (error: any) {
          toast.error('Erro ao carregar unidades.', { description: error.message });
      }
  };

  useEffect(() => {
    fetchStudents();
    fetchUnits();
  }, [user, selectedUnit]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof StudentFormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleAddClick = () => {
    if (!canAddStudent) {
      setShowUpgradeModal(true);
      return;
    }
    setEditingStudent(null);
    setFormData({
      full_name: '', email: '', phone: '', birth_date: '',
      emergency_contact: '', emergency_phone: '', 
      unit_id: selectedUnit?.id || null, active: true,
    });
    setIsDialogOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent, student: any) => {
    e.stopPropagation();
    setEditingStudent(student);
    setFormData({
        full_name: student.full_name || '',
        email: student.email || '',
        phone: student.phone || '',
        birth_date: student.birth_date || '',
        emergency_contact: student.emergency_contact || '',
        emergency_phone: student.emergency_phone || '',
        unit_id: student.unit_id || null,
        active: student.active !== undefined ? student.active : true,
    });
    setIsDialogOpen(true);
  };
  
  const handleDeleteClick = (e: React.MouseEvent, student: any) => {
    e.stopPropagation();
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!studentToDelete) return;
    try {
        await deleteDoc(doc(db, 'students', studentToDelete.id));
        toast.success(`Aluno "${studentToDelete.full_name}" excluído com sucesso.`);
        fetchStudents(); // Re-fetch students list
        setIsDeleteDialogOpen(false);
        setStudentToDelete(null);
    } catch (error: any) {
        toast.error("Erro ao excluir aluno.", { description: error.message });
    }
  };

  const handleSaveStudent = async () => {
    setIsSaving(true);
    try {
        const resolvedSchoolId = await schoolId;
        if (!resolvedSchoolId) throw new Error("ID da escola não encontrado.");

        const validatedData = studentSchema.parse({
          ...formData,
          unit_id: formData.unit_id || null
        });

        if (editingStudent) {
            const studentRef = doc(db, 'students', editingStudent.id);
            await updateDoc(studentRef, { ...validatedData, updated_at: serverTimestamp() });
            toast.success('Aluno atualizado com sucesso!');
        } else {
            await addDoc(collection(db, 'students'), {
                ...validatedData,
                school_id: resolvedSchoolId,
                created_at: serverTimestamp(),
            });
            toast.success('Aluno adicionado com sucesso!');
        }
        fetchStudents();
        setIsDialogOpen(false);
    } catch (error: any) {
        toast.error('Erro ao salvar aluno', { description: error.message });
    } finally {
        setIsSaving(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' && student.active) || (statusFilter === 'inactive' && !student.active);
    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <SubscriptionLimitWarning
        limit={subscription?.student_limit}
        current={students.length}
        featureName="alunos"
        loading={subLoading}
      />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Alunos</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddClick} disabled={subLoading}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Aluno
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingStudent ? 'Editar Aluno' : 'Adicionar Novo Aluno'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="full_name" className="text-right">Nome</Label>
                    <Input id="full_name" value={formData.full_name} onChange={handleInputChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={handleInputChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">Telefone</Label>
                    <Input id="phone" value={formData.phone} onChange={handleInputChange} className="col-span-3" />
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="birth_date" className="text-right">Nascimento</Label>
                    <Input id="birth_date" type="date" value={formData.birth_date} onChange={handleInputChange} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="unit_id" className="text-right">Unidade</Label>
                     <Select value={formData.unit_id || ''} onValueChange={(value) => handleSelectChange('unit_id', value)}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Selecione a unidade" />
                        </SelectTrigger>
                        <SelectContent>
                            {units.map(unit => <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="active" className="text-right">Status</Label>
                     <Select value={formData.active ? 'active' : 'inactive'} onValueChange={(value) => handleSelectChange('active', value === 'active')}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <DialogFooter>
              <Button type="button" onClick={handleSaveStudent} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                {editingStudent ? 'Salvar Alterações' : 'Adicionar Aluno'}
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center mb-4 space-x-4">
        <div className="relative w-full max-w-sm">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input placeholder="Buscar por nome ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
            </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center"><Loader2 className="mx-auto my-4 h-8 w-8 animate-spin" /></TableCell></TableRow>
            ) : filteredStudents.length > 0 ? (
              filteredStudents.map(student => (
                <TableRow key={student.id} onClick={() => navigate(`/alunos/${student.id}`)} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{student.full_name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell>{student.unit_name || '-'}</TableCell>
                  <TableCell><Badge variant={student.active ? 'default' : 'destructive'}>{student.active ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" size="icon" onClick={(e) => handleEditClick(e, student)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="icon" onClick={(e) => handleDeleteClick(e, student)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow><TableCell colSpan={5} className="text-center">Nenhum aluno encontrado.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o aluno <span className='font-bold'>{studentToDelete?.full_name}</span> e removerá seus dados de nossos servidores.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Sim, excluir</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpgradeModal
        show={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="alunos"
      />
    </DashboardLayout>
  );
}

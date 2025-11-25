
import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db, storage } from '@/integrations/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash, Loader2, Upload, Shirt, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Costume {
  id: string;
  name: string;
  imageUrl: string;
  school_id: string;
  studentIds?: string[];
}

interface Student {
    id: string;
    full_name: string;
    avatarUrl?: string;
}

export default function CostumesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [costumes, setCostumes] = useState<Costume[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAssociationOpen, setIsAssociationOpen] = useState(false);
  
  const [editingCostume, setEditingCostume] = useState<Costume | null>(null);
  const [associatingCostume, setAssociatingCostume] = useState<Costume | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  const [formData, setFormData] = useState<{ name: string }>({ name: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const schoolId = useMemo(async () => {
    if (!user) return null;
    const schoolQuery = query(collection(db, 'schools'), where('admin_id', '==', user.uid));
    const schoolSnapshot = await getDocs(schoolQuery);
    return schoolSnapshot.empty ? null : schoolSnapshot.docs[0].id;
  }, [user]);

  const fetchData = async () => {
    const resolvedSchoolId = await schoolId;
    if (!resolvedSchoolId) return;
    setLoading(true);
    try {
      const costumesQuery = query(collection(db, 'costumes'), where('school_id', '==', resolvedSchoolId));
      const studentsQuery = query(collection(db, 'students'), where('school_id', '==', resolvedSchoolId));
      
      const [costumesSnapshot, studentsSnapshot] = await Promise.all([
        getDocs(costumesQuery),
        getDocs(studentsQuery)
      ]);

      const fetchedCostumes = costumesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Costume));
      const fetchedStudents = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      
      setCostumes(fetchedCostumes);
      setStudents(fetchedStudents);
    } catch (error: any) {
      toast.error('Erro ao carregar dados:', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleOpenForm = (costume: Costume | null = null) => {
    setEditingCostume(costume);
    setFormData(costume ? { name: costume.name } : { name: '' });
    setImageFile(null);
    setIsFormOpen(true);
  };

  const handleOpenAssociation = (costume: Costume) => {
      setAssociatingCostume(costume);
      setSelectedStudents(costume.studentIds || []);
      setIsAssociationOpen(true);
  }

  const handleSaveCostume = async () => {
    /* ... (lógica de salvar figurino igual à anterior) */
  };

 const handleSaveAssociation = async () => {
    if (!associatingCostume) return;
    setIsSaving(true);
    try {
        const costumeRef = doc(db, 'costumes', associatingCostume.id);
        await updateDoc(costumeRef, { studentIds: selectedStudents });
        toast.success("Alunos associados com sucesso!");
        fetchData(); // Refresh data
        setIsAssociationOpen(false);
    } catch (error: any) {
        toast.error("Erro ao associar alunos:", { description: error.message });
    } finally {
        setIsSaving(false);
    }
 };

 const toggleStudentSelection = (studentId: string) => {
     setSelectedStudents(prev => 
        prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
     );
 }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between"><h1 className="text-3xl font-bold">Catálogo de Figurinos</h1><Button onClick={() => handleOpenForm()}><PlusCircle className="mr-2 h-4 w-4" /> Criar Figurino</Button></div>
        {loading ? <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {costumes.map(costume => (
                    <Card key={costume.id} className="overflow-hidden flex flex-col">
                        <img src={costume.imageUrl} alt={costume.name} className="w-full h-48 object-cover" />
                        <CardContent className='p-4 flex flex-col flex-1'>
                           <CardTitle className='text-lg'>{costume.name}</CardTitle>
                            <div className='text-sm text-muted-foreground mt-1'>{costume.studentIds?.length || 0} aluno(s)</div>
                           <div className='flex-grow'></div>
                           <div className='flex justify-end gap-2 mt-4'>
                             <Button variant="secondary" size="sm" onClick={() => handleOpenAssociation(costume)}><Users className="h-4 w-4 mr-1"/>Alunos</Button>
                             <Button variant="destructive" size="sm" onClick={() => { /* ... delete logic */ }}><Trash className="h-4 w-4"/></Button>
                           </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        )}

        {/* Formulário de Criação/Edição */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>{/* ... (código do formulário igual ao anterior) */}</Dialog>

        {/* Modal de Associação de Alunos */}
        <Dialog open={isAssociationOpen} onOpenChange={setIsAssociationOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Associar Alunos ao Figurino</DialogTitle><DialogDescription>Selecione os alunos que usarão o figurino "{associatingCostume?.name}".</DialogDescription></DialogHeader>
                <div className="py-4 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-3">
                        {students.map(student => (
                            <div key={student.id} className="flex items-center space-x-3 bg-background p-2 rounded-md">
                                <Checkbox id={`student-${student.id}`} checked={selectedStudents.includes(student.id)} onCheckedChange={() => toggleStudentSelection(student.id)} />
                                <Avatar className="h-9 w-9"><AvatarImage src={student.avatarUrl} /><AvatarFallback>{student.full_name.charAt(0)}</AvatarFallback></Avatar>
                                <Label htmlFor={`student-${student.id}`} className="font-medium flex-1 cursor-pointer">{student.full_name}</Label>
                            </div>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAssociationOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSaveAssociation} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar Associações'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}


import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, QrCode, Trash2, Pencil, Loader2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, serverTimestamp } from 'firebase/firestore';

interface Class {
  id: string;
  name: string;
  description?: string;
  schedule_day: string;
  schedule_time: string;
  max_students: number;
  qr_code?: string;
  school_id: string;
}

const DAYS_OF_WEEK = [ "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado", "Domingo" ];

export default function Classes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  const [selectedQRClass, setSelectedQRClass] = useState<Class | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [classToDelete, setClassToDelete] = useState<Class | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    schedule_day: "",
    schedule_time: "",
    max_students: "30",
  });

  const schoolId = useMemo(async () => {
    if (!user) return null;
    const schoolQuery = query(collection(db, 'schools'), where('admin_id', '==', user.uid));
    const schoolSnapshot = await getDocs(schoolQuery);
    if (schoolSnapshot.empty) return null;
    return schoolSnapshot.docs[0].id;
  }, [user]);

  const fetchClasses = async () => {
    if (!user || !schoolId) return;
    setLoading(true);
    try {
      const resolvedSchoolId = await schoolId;
      if (!resolvedSchoolId) throw new Error("Nenhuma escola encontrada para seu usuário.");
      
      const classesQuery = query(collection(db, 'classes'), where('school_id', '==', resolvedSchoolId), orderBy('schedule_day'));
      const querySnapshot = await getDocs(classesQuery);
      const classesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Class[];
      setClasses(classesData);
    } catch (error: any) {
      toast.error("Erro ao carregar turmas: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
      fetchClasses();
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { id, value } = e.target;
      setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
      setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleAddNew = () => {
      setEditingClass(null);
      setFormData({ name: "", description: "", schedule_day: "", schedule_time: "", max_students: "30" });
      setIsFormOpen(true);
  }

  const handleEdit = (classItem: Class) => {
      setEditingClass(classItem);
      setFormData({
          name: classItem.name,
          description: classItem.description || "",
          schedule_day: classItem.schedule_day,
          schedule_time: classItem.schedule_time,
          max_students: String(classItem.max_students)
      });
      setIsFormOpen(true);
  }

  const handleDelete = (classItem: Class) => {
      setClassToDelete(classItem);
      setIsDeleteDialogOpen(true);
  }

  const confirmDelete = async () => {
      if (!classToDelete) return;
      try {
          await deleteDoc(doc(db, "classes", classToDelete.id));
          toast.success(`Turma "${classToDelete.name}" excluída com sucesso!`);
          fetchClasses();
          setIsDeleteDialogOpen(false);
      } catch (error: any) {
          toast.error("Erro ao excluir turma: " + error.message);
      }
  }

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const resolvedSchoolId = await schoolId;
      if (!resolvedSchoolId) throw new Error("Escola não encontrada.");
      
      const classData = {
        ...formData,
        max_students: parseInt(formData.max_students, 10),
        school_id: resolvedSchoolId,
      };

      if(editingClass) {
        // Update
        const classRef = doc(db, 'classes', editingClass.id);
        await updateDoc(classRef, { ...classData, updated_at: serverTimestamp() });
        toast.success("Turma atualizada com sucesso!");
      } else {
        // Create
        const qrCode = `xpace-class-${Date.now()}`;
        await addDoc(collection(db, "classes"), { ...classData, qr_code: qrCode, created_at: serverTimestamp() });
        toast.success("Turma criada com sucesso!");
      }

      setIsFormOpen(false);
      fetchClasses();
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar turma");
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleShowQr = (classItem: Class) => {
      setSelectedQRClass(classItem);
      setIsQrDialogOpen(true);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Turmas</h1>
            <p className="text-muted-foreground">Gerencie as turmas, horários e alunos.</p>
          </div>
           <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Turma
            </Button>
        </div>

        {loading ? (
             <div className="flex items-center justify-center h-64"><Loader2 className="h-12 w-12 animate-spin" /></div>
        ) : classes.length === 0 ? (
            <Card className="w-full">
                <CardContent className="flex flex-col items-center justify-center h-64 gap-4">
                <h3 className='text-xl font-semibold'>Nenhuma turma cadastrada</h3>
                <p className="text-muted-foreground">Clique em "Nova Turma" para começar.</p>
                 <Button onClick={handleAddNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar sua primeira turma
                </Button>
                </CardContent>
            </Card>
        ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {classes.map((classItem) => (
                    <Card key={classItem.id} className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                        {classItem.name}
                        </CardTitle>
                        <CardDescription>{classItem.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <p className="text-sm font-medium">{classItem.schedule_day} às {classItem.schedule_time}</p>
                        <p className="text-sm text-muted-foreground mt-2">Capacidade: {classItem.max_students} alunos</p>
                        {/* Adicionar contagem de alunos matriculados aqui no futuro */}
                    </CardContent>
                    <div className="flex items-center justify-end p-4 border-t gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleShowQr(classItem)}><QrCode className="h-4 w-4" /></Button>
                        <Button variant="outline" size="icon" onClick={() => handleEdit(classItem)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="icon" onClick={() => handleDelete(classItem)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    </Card>
                ))}
            </div>
        )}

        {/* Formulário de Adicionar/Editar Turma */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent>
                <DialogHeader>
                <DialogTitle>{editingClass ? "Editar Turma" : "Criar Nova Turma"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome da Turma</Label>
                        <Input id="name" placeholder="Ex: Ballet Clássico Infantil" value={formData.name} onChange={handleInputChange} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Textarea id="description" placeholder="Uma breve descrição da turma..." value={formData.description} onChange={handleInputChange} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="schedule_day">Dia da Semana</Label>
                             <Select onValueChange={(value) => handleSelectChange('schedule_day', value)} value={formData.schedule_day}>
                                <SelectTrigger><SelectValue placeholder="Selecione o dia" /></SelectTrigger>
                                <SelectContent>
                                    {DAYS_OF_WEEK.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="schedule_time">Horário</Label>
                             <Input id="schedule_time" type="time" value={formData.schedule_time} onChange={handleInputChange} />
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="max_students">Máximo de Alunos</Label>
                        <Input id="max_students" type="number" value={formData.max_students} onChange={handleInputChange} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                        {editingClass ? "Salvar Alterações" : "Criar Turma"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Dialog do QR Code */}
        <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>QR Code - {selectedQRClass?.name}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              {selectedQRClass?.qr_code && (
                <QRCodeSVG value={selectedQRClass.qr_code} size={256} />
              )}
              <p className="text-sm text-muted-foreground text-center">Alunos podem escanear este código para marcar presença.</p>
            </div>
          </DialogContent>
        </Dialog>

         {/* Dialog de Exclusão */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta ação não pode ser desfeita. Isso excluirá permanentemente a turma <span className='font-bold'>{classToDelete?.name}</span> e todos os seus dados associados.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Sim, excluir turma</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

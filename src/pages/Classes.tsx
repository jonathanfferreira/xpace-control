import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, QrCode, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';

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

const DAYS_OF_WEEK = [
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
  "Domingo",
];

export default function Classes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedQRClass, setSelectedQRClass] = useState<Class | null>(null);
  const [newClass, setNewClass] = useState({
    name: "",
    description: "",
    schedule_day: "",
    schedule_time: "",
    max_students: "30",
  });

  useEffect(() => {
    if (user) {
      fetchClasses();
    } else {
      navigate("/auth");
    }
  }, [user, navigate]);

  const fetchClasses = async () => {
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

      const classesQuery = query(collection(db, 'classes'), where('school_id', '==', schoolId), orderBy('schedule_day'));
      const querySnapshot = await getDocs(classesQuery);
      const classesData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Class[];
      setClasses(classesData);
    } catch (error: any) {
      toast.error("Erro ao carregar turmas: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async () => {
    if (!user) return;
    try {
      const schoolQuery = query(collection(db, 'schools'), where('admin_id', '==', user.uid));
      const schoolSnapshot = await getDocs(schoolQuery);
      if (schoolSnapshot.empty) {
        toast.error("Você precisa criar uma escola primeiro");
        return;
      }
      const schoolId = schoolSnapshot.docs[0].id;
      const qrCode = `xpace-class-${Date.now()}`;

      await addDoc(collection(db, "classes"), {
        ...newClass,
        max_students: parseInt(newClass.max_students, 10),
        school_id: schoolId,
        qr_code: qrCode,
        teacher_id: user.uid, // Assuming the class creator is the teacher
      });

      toast.success("Turma criada com sucesso!");
      setIsAddDialogOpen(false);
      setNewClass({ name: "", description: "", schedule_day: "", schedule_time: "", max_students: "30" });
      fetchClasses();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar turma");
    }
  };

  const handleDeleteClass = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta turma?")) return;

    try {
      await deleteDoc(doc(db, "classes", id));
      toast.success("Turma excluída com sucesso!");
      fetchClasses();
    } catch (error: any) {
      toast.error("Erro ao excluir turma");
    }
  };
  
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Turmas</h1>
            <p className="text-muted-foreground">Gerencie as turmas e horários</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Turma
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Turma</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                 {/* Form fields... */}
                <Button onClick={handleAddClass} className="w-full">Criar Turma</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <Card key={classItem.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {classItem.name}
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => setSelectedQRClass(classItem)}>
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteClass(classItem.id)} className="hover:bg-destructive hover:text-destructive-foreground">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>{classItem.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{classItem.schedule_day}</p>
                <p className="text-sm text-muted-foreground">{classItem.schedule_time}</p>
                <p className="text-sm text-muted-foreground mt-2">Máximo: {classItem.max_students} alunos</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {classes.length === 0 && !loading && (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Nenhuma turma cadastrada</p>
            </CardContent>
          </Card>
        )}

        <Dialog open={!!selectedQRClass} onOpenChange={() => setSelectedQRClass(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>QR Code - {selectedQRClass?.name}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              {selectedQRClass?.qr_code && (
                <QRCodeSVG value={selectedQRClass.qr_code} size={256} />
              )}
              <p className="text-sm text-muted-foreground text-center">Os alunos podem escanear este código para marcar presença.</p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

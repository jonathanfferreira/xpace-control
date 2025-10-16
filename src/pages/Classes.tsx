import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, QrCode, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import type { Database } from "@/integrations/supabase/types";

type Class = Database["public"]["Tables"]["classes"]["Row"];

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
    checkAuth();
    fetchClasses();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("schedule_day");

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar turmas");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClass = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: school } = await supabase
        .from("schools")
        .select("id")
        .eq("admin_id", user.id)
        .single();

      if (!school) {
        toast.error("Você precisa criar uma escola primeiro");
        return;
      }

      const qrCode = `xpace-class-${Date.now()}`;

      const { error } = await supabase.from("classes").insert({
        ...newClass,
        max_students: parseInt(newClass.max_students),
        school_id: school.id,
        qr_code: qrCode,
      });

      if (error) throw error;

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
      const { error } = await supabase.from("classes").delete().eq("id", id);
      if (error) throw error;
      toast.success("Turma excluída com sucesso!");
      fetchClasses();
    } catch (error: any) {
      toast.error("Erro ao excluir turma");
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Turmas</h1>
            <p className="text-muted-foreground">Gerencie as turmas e horários</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-xpace">
                <Plus className="h-4 w-4 mr-2" />
                Nova Turma
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Turma</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome da Turma</Label>
                  <Input
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    placeholder="Ex: Ballet Iniciante"
                  />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Input
                    value={newClass.description}
                    onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
                    placeholder="Descrição da turma"
                  />
                </div>
                <div>
                  <Label>Dia da Semana</Label>
                  <Select value={newClass.schedule_day} onValueChange={(value) => setNewClass({ ...newClass, schedule_day: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o dia" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day} value={day}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Horário</Label>
                  <Input
                    type="time"
                    value={newClass.schedule_time}
                    onChange={(e) => setNewClass({ ...newClass, schedule_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Máximo de Alunos</Label>
                  <Input
                    type="number"
                    value={newClass.max_students}
                    onChange={(e) => setNewClass({ ...newClass, max_students: e.target.value })}
                    placeholder="30"
                  />
                </div>
                <Button onClick={handleAddClass} className="w-full gradient-xpace">
                  Criar Turma
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Classes Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classes.map((classItem) => (
            <Card key={classItem.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {classItem.name}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedQRClass(classItem)}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteClass(classItem.id)}
                      className="hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>{classItem.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{classItem.schedule_day}</p>
                <p className="text-sm text-muted-foreground">{classItem.schedule_time}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Máximo: {classItem.max_students} alunos
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {classes.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Nenhuma turma cadastrada</p>
            </CardContent>
          </Card>
        )}

        {/* QR Code Dialog */}
        <Dialog open={!!selectedQRClass} onOpenChange={() => setSelectedQRClass(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>QR Code - {selectedQRClass?.name}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4">
              {selectedQRClass?.qr_code && (
                <QRCodeSVG value={selectedQRClass.qr_code} size={256} />
              )}
              <p className="text-sm text-muted-foreground text-center">
                Os alunos devem escanear este código para marcar presença
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Plus, Edit, Trash2 } from "lucide-react";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface Unit {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  active: boolean;
}

export default function Units() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    phone: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
    if (user) {
      fetchUnits();
    }
  }, [user, authLoading, navigate]);

  const fetchUnits = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const schoolsQuery = query(collection(db, "schools"), where("admin_id", "==", user.uid));
      const schoolSnapshot = await getDocs(schoolsQuery);

      if (schoolSnapshot.empty) {
        toast.error("Escola não encontrada");
        setUnits([]);
        return;
      }
      const schoolId = schoolSnapshot.docs[0].id;

      const unitsQuery = query(collection(db, "school_units"), where("school_id", "==", schoolId));
      const unitsSnapshot = await getDocs(unitsQuery);
      const unitsData = unitsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Unit[];
      setUnits(unitsData);
    } catch (error: any) {
      toast.error("Erro ao carregar unidades");
    } finally {
      setLoading(false);
    }
  };

  const getSchoolId = async (): Promise<string | null> => {
    if (!user) return null;
    const schoolsQuery = query(collection(db, "schools"), where("admin_id", "==", user.uid));
    const schoolSnapshot = await getDocs(schoolsQuery);
    if (schoolSnapshot.empty) {
      toast.error("Escola não encontrada");
      return null;
    }
    return schoolSnapshot.docs[0].id;
  };

  const handleSubmit = async () => {
    const schoolId = await getSchoolId();
    if (!schoolId) return;

    try {
      if (editingUnit) {
        const unitDocRef = doc(db, "school_units", editingUnit.id);
        await updateDoc(unitDocRef, formData);
        toast.success("Unidade atualizada!");
      } else {
        await addDoc(collection(db, "school_units"), { ...formData, school_id: schoolId });
        toast.success("Unidade criada!");
      }
      setIsDialogOpen(false);
      resetForm();
      fetchUnits();
    } catch (error: any) {
      toast.error("Erro ao salvar unidade: " + error.message);
    }
  };

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit);
    setFormData({
      name: unit.name,
      address: unit.address || "",
      city: unit.city || "",
      phone: unit.phone || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (unitId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta unidade?")) return;

    try {
      const unitDocRef = doc(db, "school_units", unitId);
      await deleteDoc(unitDocRef);
      toast.success("Unidade excluída!");
      fetchUnits();
    } catch (error: any) {
      toast.error("Erro ao excluir unidade");
    }
  };

  const resetForm = () => {
    setFormData({ name: "", address: "", city: "", phone: "" });
    setEditingUnit(null);
  };

  if (loading || authLoading) {
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
            <h1 className="text-3xl md:text-4xl font-bold">Unidades</h1>
            <p className="text-muted-foreground">
              Gerencie as unidades da sua escola
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
            setIsDialogOpen(isOpen);
            if (!isOpen) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" />Nova Unidade</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUnit ? "Editar Unidade" : "Nova Unidade"}</DialogTitle>
                <DialogDescription>Preencha as informações da unidade</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Nome da Unidade</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Unidade Centro" />
                </div>
                <div>
                  <Label htmlFor="address">Endereço</Label>
                  <Input id="address" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Rua, número" />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Cidade" />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="(11) 99999-9999" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                <Button onClick={handleSubmit}>{editingUnit ? "Salvar" : "Criar"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {units.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">Nenhuma unidade cadastrada ainda</CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {units.map((unit) => (
              <Card key={unit.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2"><Building2 className="h-5 w-5" />{unit.name}</div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(unit)}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(unit.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm"><span className="font-medium">Endereço:</span> {unit.address || "-"}</p>
                  <p className="text-sm"><span className="font-medium">Cidade:</span> {unit.city || "-"}</p>
                  <p className="text-sm"><span className="font-medium">Telefone:</span> {unit.phone || "-"}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

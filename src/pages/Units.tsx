import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Plus, Edit, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
    checkAuth();
    fetchUnits();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const fetchUnits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: schoolData } = await supabase
        .from("schools")
        .select("id")
        .eq("admin_id", user.id)
        .single();

      if (!schoolData) {
        toast.error("Escola não encontrada");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("school_units")
        .select("*")
        .eq("school_id", schoolData.id)
        .order("name");

      if (error) throw error;
      setUnits(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar unidades");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: schoolData } = await supabase
        .from("schools")
        .select("id")
        .eq("admin_id", user.id)
        .single();

      if (!schoolData) {
        toast.error("Escola não encontrada");
        return;
      }

      if (editingUnit) {
        const { error } = await supabase
          .from("school_units")
          .update(formData)
          .eq("id", editingUnit.id);

        if (error) throw error;
        toast.success("Unidade atualizada!");
      } else {
        const { error } = await supabase
          .from("school_units")
          .insert({
            ...formData,
            school_id: schoolData.id,
          });

        if (error) throw error;
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
      const { error } = await supabase
        .from("school_units")
        .delete()
        .eq("id", unitId);

      if (error) throw error;
      toast.success("Unidade excluída!");
      fetchUnits();
    } catch (error: any) {
      toast.error("Erro ao excluir unidade");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      phone: "",
    });
    setEditingUnit(null);
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
            <h1 className="text-3xl md:text-4xl font-bold">Unidades</h1>
            <p className="text-muted-foreground">
              Gerencie as unidades da sua escola
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Unidade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUnit ? "Editar Unidade" : "Nova Unidade"}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações da unidade
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Nome da Unidade</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Unidade Centro"
                  />
                </div>

                <div>
                  <Label>Endereço</Label>
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Rua, número"
                  />
                </div>

                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Cidade"
                  />
                </div>

                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit}>
                  {editingUnit ? "Salvar" : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {units.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma unidade cadastrada ainda
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {units.map((unit) => (
              <Card key={unit.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      {unit.name}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(unit)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(unit.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Endereço:</span> {unit.address || "-"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Cidade:</span> {unit.city || "-"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Telefone:</span> {unit.phone || "-"}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

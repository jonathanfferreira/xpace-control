import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Shirt, Package } from "lucide-react";
import { toast } from "sonner";

interface Costume {
  id: string;
  school_id: string;
  name: string;
  description: string | null;
  size: string | null;
  color: string | null;
  quantity: number;
  available: number;
  photo_url: string | null;
  purchase_price: number | null;
  rental_price: number | null;
  created_at: string;
}

export default function Costumes() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCostume, setEditingCostume] = useState<Costume | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    size: "",
    color: "",
    quantity: 1,
    purchase_price: "",
    rental_price: "",
  });

  const queryClient = useQueryClient();

  // Fetch costumes
  const { data: costumes, isLoading } = useQuery({
    queryKey: ["costumes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("costumes")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as Costume[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        available: data.quantity, // Initially all are available
        purchase_price: data.purchase_price
          ? parseFloat(data.purchase_price)
          : null,
        rental_price: data.rental_price ? parseFloat(data.rental_price) : null,
      };

      if (editingCostume) {
        const { error } = await supabase
          .from("costumes")
          .update(payload)
          .eq("id", editingCostume.id);
        if (error) throw error;
      } else {
        // Get user's school
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuário não autenticado");

        const { data: userRole } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (!userRole) throw new Error("Perfil de usuário não encontrado");

        const { data: school } = await supabase
          .from("schools")
          .select("id")
          .eq("admin_id", user.id)
          .single();

        if (!school) throw new Error("Escola não encontrada");

        const { error } = await supabase
          .from("costumes")
          .insert([{ ...payload, school_id: school.id }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costumes"] });
      setIsDialogOpen(false);
      resetForm();
      toast.success(
        editingCostume ? "Figurino atualizado!" : "Figurino criado!"
      );
    },
    onError: (error) => {
      toast.error("Erro ao salvar figurino: " + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("costumes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costumes"] });
      toast.success("Figurino excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir figurino: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      size: "",
      color: "",
      quantity: 1,
      purchase_price: "",
      rental_price: "",
    });
    setEditingCostume(null);
  };

  const handleEdit = (costume: Costume) => {
    setEditingCostume(costume);
    setFormData({
      name: costume.name,
      description: costume.description || "",
      size: costume.size || "",
      color: costume.color || "",
      quantity: costume.quantity,
      purchase_price: costume.purchase_price?.toString() || "",
      rental_price: costume.rental_price?.toString() || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Figurinos</h1>
          <p className="text-muted-foreground">
            Gerencie o estoque de figurinos da escola
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Figurino
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCostume ? "Editar Figurino" : "Novo Figurino"}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do figurino
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm font-medium">Nome</label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Vestido Ballet Lago dos Cisnes"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Descreva o figurino..."
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tamanho</label>
                  <Input
                    value={formData.size}
                    onChange={(e) =>
                      setFormData({ ...formData, size: e.target.value })
                    }
                    placeholder="Ex: P, M, G, Infantil 8-10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Cor</label>
                  <Input
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    placeholder="Ex: Branco, Preto"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Quantidade</label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Preço de Compra (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchase_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        purchase_price: e.target.value,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-sm font-medium">
                    Preço de Aluguel (R$)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.rental_price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rental_price: e.target.value,
                      })
                    }
                    placeholder="0.00"
                  />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {costumes?.map((costume) => (
          <Card key={costume.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shirt className="h-5 w-5" />
                {costume.name}
              </CardTitle>
              {costume.description && (
                <CardDescription>{costume.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                {costume.size && <Badge variant="outline">{costume.size}</Badge>}
                {costume.color && (
                  <Badge variant="outline">{costume.color}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4" />
                <span>
                  {costume.available} disponível de {costume.quantity} total
                </span>
              </div>
              {costume.rental_price && (
                <div className="text-sm font-medium">
                  Aluguel: R$ {costume.rental_price.toFixed(2)}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(costume)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (
                      confirm("Tem certeza que deseja excluir este figurino?")
                    ) {
                      deleteMutation.mutate(costume.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {costumes?.length === 0 && (
        <div className="text-center py-12">
          <Shirt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Nenhum figurino cadastrado
          </h3>
          <p className="text-muted-foreground mb-4">
            Comece adicionando os figurinos disponíveis na escola
          </p>
        </div>
      )}
    </div>
  );
}


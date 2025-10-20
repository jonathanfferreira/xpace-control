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
import { Plus, Edit, Trash2, Music } from "lucide-react";
import { toast } from "sonner";

interface DanceStyle {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  created_at: string;
}

export default function DanceStyles() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<DanceStyle | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#6324b2",
  });

  const queryClient = useQueryClient();

  // Fetch dance styles
  const { data: danceStyles, isLoading } = useQuery({
    queryKey: ["danceStyles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dance_styles")
        .select("*")
        .order("name");

      if (error) throw error;
      return data as DanceStyle[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingStyle) {
        const { error } = await supabase
          .from("dance_styles")
          .update(data)
          .eq("id", editingStyle.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("dance_styles").insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["danceStyles"] });
      setIsDialogOpen(false);
      resetForm();
      toast.success(
        editingStyle
          ? "Estilo de dança atualizado!"
          : "Estilo de dança criado!"
      );
    },
    onError: (error) => {
      toast.error("Erro ao salvar estilo de dança: " + error.message);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("dance_styles")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["danceStyles"] });
      toast.success("Estilo de dança excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir estilo de dança: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", color: "#6324b2" });
    setEditingStyle(null);
  };

  const handleEdit = (style: DanceStyle) => {
    setEditingStyle(style);
    setFormData({
      name: style.name,
      description: style.description || "",
      color: style.color,
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
          <h1 className="text-3xl font-bold">Estilos de Dança</h1>
          <p className="text-muted-foreground">
            Gerencie os estilos de dança oferecidos pela escola
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Estilo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingStyle ? "Editar Estilo" : "Novo Estilo de Dança"}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do estilo de dança
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nome</label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: Ballet Clássico"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Descrição</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Descreva o estilo de dança..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Cor</label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="w-20 h-10"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      placeholder="#6324b2"
                    />
                  </div>
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
        {danceStyles?.map((style) => (
          <Card key={style.id} className="relative">
            <div
              className="absolute top-0 left-0 right-0 h-2 rounded-t-lg"
              style={{ backgroundColor: style.color }}
            />
            <CardHeader className="pt-6">
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" style={{ color: style.color }} />
                {style.name}
              </CardTitle>
              {style.description && (
                <CardDescription>{style.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(style)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (
                      confirm(
                        "Tem certeza que deseja excluir este estilo de dança?"
                      )
                    ) {
                      deleteMutation.mutate(style.id);
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

      {danceStyles?.length === 0 && (
        <div className="text-center py-12">
          <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Nenhum estilo de dança cadastrado
          </h3>
          <p className="text-muted-foreground mb-4">
            Comece adicionando os estilos de dança oferecidos pela escola
          </p>
        </div>
      )}
    </div>
  );
}


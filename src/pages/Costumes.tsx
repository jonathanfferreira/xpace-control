import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/useAuth";
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
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';

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
  const { user } = useAuth();
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

  const fetchCostumes = async () => {
    if (!user) return [];
    const schoolQuery = query(collection(db, 'schools'), where('admin_id', '==', user.uid));
    const schoolSnapshot = await getDocs(schoolQuery);
    if (schoolSnapshot.empty) return [];
    const schoolId = schoolSnapshot.docs[0].id;

    const costumesQuery = query(collection(db, 'costumes'), where('school_id', '==', schoolId), orderBy('name'));
    const querySnapshot = await getDocs(costumesQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Costume[];
  };

  const { data: costumes, isLoading } = useQuery({ queryKey: ["costumes", user?.uid], queryFn: fetchCostumes, enabled: !!user });

    const getSchoolId = async () => {
        if (!user) throw new Error("Usuário não autenticado");
        const schoolQuery = query(collection(db, 'schools'), where('admin_id', '==', user.uid));
        const schoolSnapshot = await getDocs(schoolQuery);
        if (schoolSnapshot.empty) throw new Error("Escola não encontrada");
        return schoolSnapshot.docs[0].id;
    };

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const school_id = await getSchoolId();
      const payload = {
        ...data,
        school_id,
        available: data.quantity, // Initially all are available
        purchase_price: data.purchase_price ? parseFloat(data.purchase_price) : null,
        rental_price: data.rental_price ? parseFloat(data.rental_price) : null,
      };

      if (editingCostume) {
        await updateDoc(doc(db, "costumes", editingCostume.id), payload);
      } else {
        await addDoc(collection(db, "costumes"), payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costumes"] });
      setIsDialogOpen(false);
      resetForm();
      toast.success(editingCostume ? "Figurino atualizado!" : "Figurino criado!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar figurino: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
        await deleteDoc(doc(db, "costumes", id));
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
    setFormData({ name: "", description: "", size: "", color: "", quantity: 1, purchase_price: "", rental_price: "" });
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
    return <div className="flex items-center justify-center h-96"><div className="text-lg">Carregando...</div></div>;
  }

  return (
    <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="text-3xl font-bold">Figurinos</h1>
                <p className="text-muted-foreground">Gerencie o estoque de figurinos da escola</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                    <Button onClick={resetForm}><Plus className="mr-2 h-4 w-4" />Novo Figurino</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingCostume ? "Editar Figurino" : "Novo Figurino"}</DialogTitle>
                        <DialogDescription>Preencha as informações do figurino</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Form fields */}
                        <DialogFooter className="mt-6">
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? "Salvando..." : "Salvar"}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {costumes?.map((costume) => (
                <Card key={costume.id}>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Shirt className="h-5 w-5" />{costume.name}</CardTitle>
                        {costume.description && <CardDescription>{costume.description}</CardDescription>}
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {/* Costume details */}
                        <div className="flex gap-2 pt-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(costume)}><Edit className="h-4 w-4 mr-1" />Editar</Button>
                            <Button variant="outline" size="sm" onClick={() => { if (confirm("Tem certeza?")) { deleteMutation.mutate(costume.id); } }} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4 mr-1" />Excluir</Button>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>

        {costumes?.length === 0 && (
            <div className="text-center py-12">
                <Shirt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum figurino cadastrado</h3>
                <p className="text-muted-foreground mb-4">Comece adicionando os figurinos disponíveis na escola</p>
            </div>
        )}
    </div>
  );
}

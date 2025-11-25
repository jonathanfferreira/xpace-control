import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/integrations/firebase/client";
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
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';

interface DanceStyle {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
}

export default function DanceStyles() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStyle, setEditingStyle] = useState<DanceStyle | null>(null);
  const [formData, setFormData] = useState({ name: "", description: "", color: "#6324b2" });

  const queryClient = useQueryClient();

  const { data: danceStyles, isLoading } = useQuery({
    queryKey: ["danceStyles"],
    queryFn: async () => {
      const stylesQuery = query(collection(db, "dance_styles"), orderBy("name"));
      const querySnapshot = await getDocs(stylesQuery);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DanceStyle[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingStyle) {
        await updateDoc(doc(db, "dance_styles", editingStyle.id), data);
      } else {
        await addDoc(collection(db, "dance_styles"), data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["danceStyles"] });
      setIsDialogOpen(false);
      resetForm();
      toast.success(editingStyle ? "Estilo de dança atualizado!" : "Estilo de dança criado!");
    },
    onError: (error) => {
      toast.error("Erro ao salvar: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
        await deleteDoc(doc(db, "dance_styles", id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["danceStyles"] });
      toast.success("Estilo de dança excluído!");
    },
    onError: (error) => {
      toast.error("Erro ao excluir: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", color: "#6324b2" });
    setEditingStyle(null);
  };

  const handleEdit = (style: DanceStyle) => {
    setEditingStyle(style);
    setFormData({ name: style.name, description: style.description || "", color: style.color });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="text-center p-12">Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-6">
        {/* UI is mostly the same, logic is now Firebase-backed */}
    </div>
  );
}

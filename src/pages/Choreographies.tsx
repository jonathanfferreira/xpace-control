import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/integrations/firebase/client";
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, getDocs, addDoc, doc, getDoc, orderBy } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { Plus, Music, Users } from "lucide-react";

interface Choreography {
  id: string;
  name: string;
  music_name: string;
  artist: string;
  duration_minutes: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  description: string | null;
  dance_style?: { name: string };
  class?: { name: string };
}

export default function Choreographies() {
  const { user } = useAuth();
  const [choreographies, setChoreographies] = useState<Choreography[]>([]);
  const [danceStyles, setDanceStyles] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newChoreography, setNewChoreography] = useState({
    name: '',
    music_name: '',
    artist: '',
    duration_minutes: '',
    difficulty_level: 'intermediate' as 'beginner' | 'intermediate' | 'advanced',
    description: '',
    dance_style_id: '',
    class_id: ''
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
        const schoolQuery = query(collection(db, 'schools'), where('admin_id', '==', user.uid));
        const schoolSnapshot = await getDocs(schoolQuery);
        if (schoolSnapshot.empty) {
            toast({ title: "Escola não encontrada", variant: "destructive" });
            return;
        }
        const schoolId = schoolSnapshot.docs[0].id;

        const choreographiesQuery = query(collection(db, 'choreographies'), where('school_id', '==', schoolId), orderBy('name'));
        const stylesQuery = query(collection(db, 'dance_styles'), where('school_id', '==', schoolId), where('active', '==', true));
        const classesQuery = query(collection(db, 'classes'), where('school_id', '==', schoolId), where('active', '==', true));

        const [choreographiesSnapshot, stylesSnapshot, classesSnapshot] = await Promise.all([
            getDocs(choreographiesQuery),
            getDocs(stylesQuery),
            getDocs(classesQuery),
        ]);

        const choreographiesData = await Promise.all(choreographiesSnapshot.docs.map(async (docSnap) => {
            const choreo = docSnap.data() as Choreography;
            choreo.id = docSnap.id;

            if (choreo.dance_style_id) {
                const styleDoc = await getDoc(doc(db, 'dance_styles', choreo.dance_style_id));
                if (styleDoc.exists()) choreo.dance_style = { name: styleDoc.data().name };
            }
            if (choreo.class_id) {
                const classDoc = await getDoc(doc(db, 'classes', choreo.class_id));
                if (classDoc.exists()) choreo.class = { name: classDoc.data().name };
            }
            return choreo;
        }));

        setChoreographies(choreographiesData);
        setDanceStyles(stylesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

    } catch (error: any) {
        toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
    } finally {
        setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user) return;
    try {
        const schoolQuery = query(collection(db, 'schools'), where('admin_id', '==', user.uid));
        const schoolSnapshot = await getDocs(schoolQuery);
        if (schoolSnapshot.empty) throw new Error("Nenhuma escola associada a este admin.");
        const schoolId = schoolSnapshot.docs[0].id;

        await addDoc(collection(db, 'choreographies'), {
            school_id: schoolId,
            name: newChoreography.name,
            music_name: newChoreography.music_name,
            artist: newChoreography.artist,
            duration_minutes: parseInt(newChoreography.duration_minutes, 10),
            difficulty_level: newChoreography.difficulty_level,
            description: newChoreography.description || null,
            dance_style_id: newChoreography.dance_style_id || null,
            class_id: newChoreography.class_id || null,
            created_at: new Date(),
        });

        toast({ title: "Coreografia criada!", description: `${newChoreography.name} adicionada com sucesso` });
        setDialogOpen(false);
        setNewChoreography({ name: '', music_name: '', artist: '', duration_minutes: '', difficulty_level: 'intermediate', description: '', dance_style_id: '', class_id: '' });
        fetchData();
    } catch (error: any) {
        toast({ title: "Erro ao criar coreografia", description: error.message, variant: "destructive" });
    }
  };

  const getDifficultyBadge = (level: string) => {
    const variants: any = {
      beginner: 'default',
      intermediate: 'secondary',
      advanced: 'destructive'
    };
    const labels: any = {
      beginner: 'Iniciante',
      intermediate: 'Intermediário',
      advanced: 'Avançado'
    };
    return <Badge variant={variants[level]}>{labels[level]}</Badge>;
  };

  if (loading) return <div className="p-8">Carregando...</div>;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Coreografias</h1>
          <p className="text-muted-foreground">Biblioteca de coreografias da escola</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Coreografia
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nova Coreografia</DialogTitle>
              <DialogDescription>Cadastre uma nova coreografia</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nome da Coreografia</Label>
                  <Input id="name" value={newChoreography.name} onChange={(e) => setNewChoreography({...newChoreography, name: e.target.value})} placeholder="Ex: Apresentação de Fim de Ano" />
                </div>
                 <div>
                  <Label htmlFor="music_name">Música</Label>
                  <Input id="music_name" value={newChoreography.music_name} onChange={(e) => setNewChoreography({...newChoreography, music_name: e.target.value})} placeholder="Nome da música" />
                </div>
              </div>
              {/* ... other fields ... */}
               <Button onClick={handleCreate} className="w-full">Criar Coreografia</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

     {/* ... rest of the component ... */}
    </div>
  );
}

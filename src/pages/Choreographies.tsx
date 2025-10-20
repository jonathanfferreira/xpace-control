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
import { supabase } from "@/integrations/supabase/client";
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
  dance_style: { name: string } | null;
  class: { name: string } | null;
}

export default function Choreographies() {
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
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('admin_id', user.id)
        .single();

      if (!school) return;

      const [choreographiesData, stylesData, classesData] = await Promise.all([
        supabase
          .from('choreographies')
          .select(`
            *,
            dance_style:dance_styles(name),
            class:classes(name)
          `)
          .eq('school_id', school.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('dance_styles')
          .select('id, name')
          .eq('school_id', school.id)
          .eq('active', true),
        supabase
          .from('classes')
          .select('id, name')
          .eq('school_id', school.id)
          .eq('active', true)
      ]);

      if (choreographiesData.error) throw choreographiesData.error;
      if (stylesData.error) throw stylesData.error;
      if (classesData.error) throw classesData.error;

      setChoreographies(choreographiesData.data || []);
      setDanceStyles(stylesData.data || []);
      setClasses(classesData.data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: school } = await supabase
        .from('schools')
        .select('id')
        .eq('admin_id', user.id)
        .single();

      if (!school) return;

      const { error } = await supabase
        .from('choreographies')
        .insert({
          school_id: school.id,
          name: newChoreography.name,
          music_name: newChoreography.music_name,
          artist: newChoreography.artist,
          duration_minutes: parseInt(newChoreography.duration_minutes),
          difficulty_level: newChoreography.difficulty_level,
          description: newChoreography.description || null,
          dance_style_id: newChoreography.dance_style_id || null,
          class_id: newChoreography.class_id || null
        });

      if (error) throw error;

      toast({
        title: "Coreografia criada!",
        description: `${newChoreography.name} adicionada com sucesso`
      });

      setDialogOpen(false);
      setNewChoreography({
        name: '',
        music_name: '',
        artist: '',
        duration_minutes: '',
        difficulty_level: 'intermediate',
        description: '',
        dance_style_id: '',
        class_id: ''
      });
      fetchData();
    } catch (error: any) {
      toast({
        title: "Erro ao criar coreografia",
        description: error.message,
        variant: "destructive"
      });
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
            <div className="space-y-4">
              <div>
                <Label>Nome da Coreografia</Label>
                <Input
                  value={newChoreography.name}
                  onChange={(e) => setNewChoreography({...newChoreography, name: e.target.value})}
                  placeholder="Ex: Apresentação de Fim de Ano"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Música</Label>
                  <Input
                    value={newChoreography.music_name}
                    onChange={(e) => setNewChoreography({...newChoreography, music_name: e.target.value})}
                    placeholder="Nome da música"
                  />
                </div>
                <div>
                  <Label>Artista</Label>
                  <Input
                    value={newChoreography.artist}
                    onChange={(e) => setNewChoreography({...newChoreography, artist: e.target.value})}
                    placeholder="Nome do artista"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Duração (minutos)</Label>
                  <Input
                    type="number"
                    value={newChoreography.duration_minutes}
                    onChange={(e) => setNewChoreography({...newChoreography, duration_minutes: e.target.value})}
                    placeholder="3"
                  />
                </div>
                <div>
                  <Label>Nível de Dificuldade</Label>
                  <Select value={newChoreography.difficulty_level} onValueChange={(value: any) => setNewChoreography({...newChoreography, difficulty_level: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Iniciante</SelectItem>
                      <SelectItem value="intermediate">Intermediário</SelectItem>
                      <SelectItem value="advanced">Avançado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Estilo de Dança</Label>
                  <Select value={newChoreography.dance_style_id} onValueChange={(value) => setNewChoreography({...newChoreography, dance_style_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um estilo" />
                    </SelectTrigger>
                    <SelectContent>
                      {danceStyles.map((style) => (
                        <SelectItem key={style.id} value={style.id}>{style.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Turma (Opcional)</Label>
                  <Select value={newChoreography.class_id} onValueChange={(value) => setNewChoreography({...newChoreography, class_id: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma turma" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Descrição (Opcional)</Label>
                <Textarea
                  value={newChoreography.description}
                  onChange={(e) => setNewChoreography({...newChoreography, description: e.target.value})}
                  placeholder="Descreva os passos, formações ou observações importantes..."
                  rows={4}
                />
              </div>
              <Button onClick={handleCreate} className="w-full">Criar Coreografia</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {choreographies.map((choreography) => (
          <Card key={choreography.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                {choreography.name}
              </CardTitle>
              <CardDescription>
                {choreography.music_name} - {choreography.artist}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Duração:</span>
                <span className="font-medium">{choreography.duration_minutes} min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Nível:</span>
                {getDifficultyBadge(choreography.difficulty_level)}
              </div>
              {choreography.dance_style && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Estilo:</span>
                  <Badge variant="outline">{choreography.dance_style.name}</Badge>
                </div>
              )}
              {choreography.class && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Turma:</span>
                  <Badge variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    {choreography.class.name}
                  </Badge>
                </div>
              )}
              {choreography.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                  {choreography.description}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {choreographies.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma coreografia cadastrada</h3>
            <p className="text-muted-foreground mb-4">
              Comece criando sua primeira coreografia
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Coreografia
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Todas as Coreografias</CardTitle>
          <CardDescription>Lista completa de coreografias cadastradas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Música</TableHead>
                <TableHead>Artista</TableHead>
                <TableHead>Duração</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Estilo</TableHead>
                <TableHead>Turma</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {choreographies.map((choreography) => (
                <TableRow key={choreography.id}>
                  <TableCell className="font-medium">{choreography.name}</TableCell>
                  <TableCell>{choreography.music_name}</TableCell>
                  <TableCell>{choreography.artist}</TableCell>
                  <TableCell>{choreography.duration_minutes} min</TableCell>
                  <TableCell>{getDifficultyBadge(choreography.difficulty_level)}</TableCell>
                  <TableCell>{choreography.dance_style?.name || '-'}</TableCell>
                  <TableCell>{choreography.class?.name || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}


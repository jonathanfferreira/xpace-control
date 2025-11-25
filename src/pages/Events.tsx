
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { db } from '@/integrations/firebase/client';
import { useAuth } from '@/hooks/useAuth';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { PlusCircle, Edit, Trash, Loader2, Calendar as CalendarIcon, MapPin, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface SchoolEvent {
  id: string;
  name: string;
  date: Date;
  location: string;
  school_id: string;
}

export default function EventsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
  const [formData, setFormData] = useState<{ name: string; location: string }>({ name: '', location: '' });
  const [eventDate, setEventDate] = useState<Date | undefined>(new Date());
  const [isSaving, setIsSaving] = useState(false);

  const schoolId = useMemo(async () => {
    if (!user) return null;
    const schoolQuery = query(collection(db, 'schools'), where('admin_id', '==', user.uid));
    const schoolSnapshot = await getDocs(schoolQuery);
    return schoolSnapshot.empty ? null : schoolSnapshot.docs[0].id;
  }, [user]);

  const fetchEvents = async () => {
    const resolvedSchoolId = await schoolId;
    if (!resolvedSchoolId) return;
    setLoading(true);
    try {
      const eventsQuery = query(collection(db, 'events'), where('school_id', '==', resolvedSchoolId));
      const querySnapshot = await getDocs(eventsQuery);
      const fetchedEvents = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return { id: doc.id, ...data, date: data.date.toDate() } as SchoolEvent;
      });
      setEvents(fetchedEvents);
    } catch (error: any) {
      toast.error('Erro ao carregar eventos:', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user]);

  const handleOpenDialog = (e: React.MouseEvent, event: SchoolEvent | null = null) => {
    e.stopPropagation(); // Impede a navegação
    if (event) {
      setEditingEvent(event);
      setFormData({ name: event.name, location: event.location });
      setEventDate(event.date);
    } else {
      setEditingEvent(null);
      setFormData({ name: '', location: '' });
      setEventDate(new Date());
    }
    setIsDialogOpen(true);
  };

  const handleSaveEvent = async () => {
    const resolvedSchoolId = await schoolId;
    if (!resolvedSchoolId || !formData.name || !eventDate) {
      toast.warning("Nome e data do evento são obrigatórios.");
      return;
    }
    setIsSaving(true);
    try {
      const eventData = { ...formData, date: eventDate, school_id: resolvedSchoolId };
      if (editingEvent) {
        const eventRef = doc(db, 'events', editingEvent.id);
        await updateDoc(eventRef, { ...eventData, updatedAt: serverTimestamp() });
        toast.success('Evento atualizado com sucesso!');
      } else {
        await addDoc(collection(db, 'events'), { ...eventData, createdAt: serverTimestamp() });
        toast.success('Evento criado com sucesso!');
      }
      fetchEvents();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error('Erro ao salvar evento:', { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Gestão de Eventos</h1>
          <Button onClick={(e) => handleOpenDialog(e)}><PlusCircle className="mr-2 h-4 w-4" /> Criar Evento</Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.length > 0 ? events.map(event => (
                    <Card key={event.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => navigate(`/eventos/${event.id}`)}>
                        <CardHeader className="flex-row items-start justify-between">
                            <div>
                                <CardTitle className="mb-1">{event.name}</CardTitle>
                                <CardDescription className='flex items-center pt-2'><CalendarIcon className='mr-2 h-4 w-4' /> {format(event.date, "PPP", { locale: ptBR })}</CardDescription>
                                <CardDescription className='flex items-center'><MapPin className='mr-2 h-4 w-4' /> {event.location || 'Local a definir'}</CardDescription>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </CardHeader>
                        <CardContent className='flex justify-end gap-2'>
                            <Button variant="outline" size="sm" onClick={(e) => handleOpenDialog(e, event)}><Edit className="h-4 w-4 mr-1"/>Editar</Button>
                        </CardContent>
                    </Card>
                )) : (
                    <div className='col-span-full text-center py-16 text-muted-foreground'>
                        <CalendarIcon className='mx-auto h-16 w-16' />
                        <p className='mt-4 text-lg'>Nenhum evento criado ainda.</p>
                        <p>Crie o seu primeiro espetáculo, workshop ou apresentação.</p>
                    </div>
                )}
            </div>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
                <DialogHeader><DialogTitle>{editingEvent ? 'Editar Evento' : 'Novo Evento'}</DialogTitle></DialogHeader>
                <div className="grid gap-4 py-4">
                    <div><Label htmlFor="name">Nome do Evento</Label><Input id="name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} /></div>
                    <div><Label htmlFor="location">Local</Label><Input id="location" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} /></div>
                    <div>
                        <Label>Data do Evento</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !eventDate && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {eventDate ? format(eventDate, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={eventDate} onSelect={setEventDate} initialFocus />
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSaveEvent} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar'}</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

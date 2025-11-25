
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { db } from '@/integrations/firebase/client';
import { doc, getDoc, collection, addDoc, getDocs, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Calendar as CalendarIcon, MapPin, Ticket, PlusCircle, Trash, Edit, Share2, QrCode } from 'lucide-react';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import EventSchedule from '@/components/features/events/EventSchedule'; // <-- Importado

interface SchoolEvent {
    id: string;
    name: string;
    date: Date;
    location: string;
}

interface TicketType {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

export default function EventDetailPage() {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState<SchoolEvent | null>(null);
    const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingTicket, setEditingTicket] = useState<TicketType | null>(null);
    const [formData, setFormData] = useState({ name: '', price: '0', quantity: '0' });

    const fetchEventDetails = async () => {
        if (!eventId) return;
        setLoading(true);
        try {
            const eventRef = doc(db, 'events', eventId);
            const eventSnap = await getDoc(eventRef);
            if (eventSnap.exists()) {
                const data = eventSnap.data();
                setEvent({ id: eventSnap.id, ...data, date: data.date.toDate() } as SchoolEvent);
            } else {
                toast.error("Evento não encontrado.");
                navigate('/eventos');
            }
            await fetchTicketTypes();
        } catch (error: any) {
            toast.error('Erro ao carregar detalhes do evento.', { description: error.message });
        } finally {
            setLoading(false);
        }
    };

    const fetchTicketTypes = async () => {
        if (!eventId) return;
        const ticketsQuery = collection(db, 'events', eventId, 'ticketTypes');
        const querySnapshot = await getDocs(ticketsQuery);
        const fetchedTickets = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketType));
        setTicketTypes(fetchedTickets);
    };

    useEffect(() => {
        fetchEventDetails();
    }, [eventId]);

    const handleOpenDialog = (ticket: TicketType | null = null) => {
        if (ticket) {
            setEditingTicket(ticket);
            setFormData({ name: ticket.name, price: String(ticket.price), quantity: String(ticket.quantity) });
        } else {
            setEditingTicket(null);
            setFormData({ name: '', price: '0', quantity: '0' });
        }
        setIsDialogOpen(true);
    };

    const handleSaveTicket = async () => {
        if (!eventId || !formData.name) {
            toast.warning("O nome do tipo de ingresso é obrigatório.");
            return;
        }
        setIsSaving(true);
        try {
            const ticketData = {
                name: formData.name,
                price: parseFloat(formData.price) || 0,
                quantity: parseInt(formData.quantity, 10) || 0,
            };

            if (editingTicket) {
                const ticketRef = doc(db, 'events', eventId, 'ticketTypes', editingTicket.id);
                await updateDoc(ticketRef, ticketData);
                toast.success("Tipo de ingresso atualizado!");
            } else {
                await addDoc(collection(db, 'events', eventId, 'ticketTypes'), ticketData);
                toast.success("Tipo de ingresso criado!");
            }
            fetchTicketTypes();
            setIsDialogOpen(false);
        } catch (error: any) {
            toast.error("Erro ao salvar ingresso.", { description: error.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleShare = () => {
        const publicUrl = `${window.location.origin}/evento/${eventId}`;
        navigator.clipboard.writeText(publicUrl);
        toast.success("Link copiado para a área de transferência!");
    }

    if (loading || !event) {
        return <DashboardLayout><div className="flex justify-center items-center h-full"><Loader2 className="h-12 w-12 animate-spin" /></div></DashboardLayout>;
    }

    return (
        <DashboardLayout>
            <div className="space-y-6">
                 <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <Button variant="outline" onClick={() => navigate('/eventos')} className="mb-4 md:mb-0"><ArrowLeft className="mr-2 h-4 w-4" />Voltar para Eventos</Button>
                    <div className="flex gap-2">
                        <Button onClick={handleShare} variant="outline"><Share2 className="mr-2 h-4 w-4"/> Compartilhar</Button>
                        <Button onClick={() => navigate(`/eventos/${eventId}/scanner`)}><QrCode className="mr-2 h-4 w-4"/> Validar Ingressos</Button>
                    </div>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl">{event.name}</CardTitle>
                        <CardDescription className='flex items-center pt-2'><CalendarIcon className='mr-2 h-4 w-4' /> {format(event.date, "PPP 'às' HH:mm", { locale: ptBR })}</CardDescription>
                        <CardDescription className='flex items-center'><MapPin className='mr-2 h-4 w-4' /> {event.location || 'Local a definir'}</CardDescription>
                    </CardHeader>
                </Card>

                <Tabs defaultValue="tickets">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="tickets">Ingressos</TabsTrigger>
                        <TabsTrigger value="schedule">Cronograma & Comunicados</TabsTrigger>
                    </TabsList>
                    <TabsContent value="tickets">
                        <Card>
                            <CardHeader className="flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center"><Ticket className="mr-2" />Tipos de Ingresso</CardTitle>
                                    <CardDescription>Crie e gerencie os ingressos para este evento.</CardDescription>
                                </div>
                                <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Criar Ingresso</Button>
                            </CardHeader>
                            <CardContent>
                                {ticketTypes.length > 0 ? (
                                    <div className="divide-y">
                                        {ticketTypes.map(ticket => (
                                            <div key={ticket.id} className="py-3 flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold">{ticket.name}</p>
                                                    <p className="text-sm text-muted-foreground">Preço: R$ {ticket.price.toFixed(2)} | Quantidade: {ticket.quantity}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" onClick={() => handleOpenDialog(ticket)}><Edit className="h-4 w-4"/></Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-center text-muted-foreground py-8">Nenhum tipo de ingresso criado.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="schedule">
                        <EventSchedule eventId={eventId!} />
                    </TabsContent>
                </Tabs>

            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingTicket ? 'Editar' : 'Novo'} Tipo de Ingresso</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div><Label>Nome do Ingresso</Label><Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Platéia A" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Preço (R$)</Label><Input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
                            <div><Label>Quantidade</Label><Input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} /></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSaveTicket} disabled={isSaving}>{isSaving ? 'Salvando...' : 'Salvar'}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </DashboardLayout>
    );
}

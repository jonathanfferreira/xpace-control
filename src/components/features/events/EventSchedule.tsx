
import { useState, useEffect } from 'react';
import { db } from '@/integrations/firebase/client';
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { PlusCircle, MessageSquare, Trash, Edit, Calendar, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface ScheduleItem {
    id: string;
    title: string;
    date: Date;
    location?: string;
    notes?: string;
    createdAt: any;
}

interface Announcement {
    id: string;
    message: string;
    createdAt: any;
}

interface EventScheduleProps {
    eventId: string;
}

export default function EventSchedule({ eventId }: EventScheduleProps) {
    const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    
    const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<ScheduleItem | null>(null);
    const [scheduleFormData, setScheduleFormData] = useState({ title: '', date: '', time: '', location: '', notes: '' });

    const [newAnnouncement, setNewAnnouncement] = useState("");
    const [isSending, setIsSending] = useState(false);

    // Firestore refs
    const scheduleRef = collection(db, 'events', eventId, 'schedule');
    const announcementsRef = collection(db, 'events', eventId, 'announcements');

    // Fetch schedule items
    useEffect(() => {
        const q = query(scheduleRef, orderBy('date', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), date: doc.data().date.toDate() } as ScheduleItem));
            setScheduleItems(items);
        });
        return unsubscribe;
    }, [eventId]);

    // Fetch announcements
    useEffect(() => {
        const q = query(announcementsRef, orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
            setAnnouncements(items);
        });
        return unsubscribe;
    }, [eventId]);

    const handleOpenScheduleDialog = (item: ScheduleItem | null = null) => {
        if (item) {
            setEditingSchedule(item);
            setScheduleFormData({
                title: item.title,
                date: format(item.date, 'yyyy-MM-dd'),
                time: format(item.date, 'HH:mm'),
                location: item.location || '',
                notes: item.notes || ''
            });
        } else {
            setEditingSchedule(null);
            setScheduleFormData({ title: '', date: '', time: '', location: '', notes: '' });
        }
        setIsScheduleDialogOpen(true);
    };

    const handleSaveScheduleItem = async () => {
        if (!scheduleFormData.title || !scheduleFormData.date || !scheduleFormData.time) {
            toast.warning("Título, data e hora são obrigatórios.");
            return;
        }

        const [year, month, day] = scheduleFormData.date.split('-').map(Number);
        const [hours, minutes] = scheduleFormData.time.split(':').map(Number);
        const combinedDate = new Date(year, month - 1, day, hours, minutes);

        const data = {
            title: scheduleFormData.title,
            date: combinedDate,
            location: scheduleFormData.location,
            notes: scheduleFormData.notes,
        };

        try {
            if (editingSchedule) {
                await updateDoc(doc(scheduleRef, editingSchedule.id), data);
                toast.success("Item do cronograma atualizado!");
            } else {
                await addDoc(scheduleRef, { ...data, createdAt: serverTimestamp() });
                toast.success("Item adicionado ao cronograma!");
            }
            setIsScheduleDialogOpen(false);
        } catch (error: any) {
            toast.error("Erro ao salvar item.", { description: error.message });
        }
    };

    const handleDeleteScheduleItem = async (id: string) => {
        if (confirm("Tem certeza que deseja excluir este item do cronograma?")) {
            try {
                await deleteDoc(doc(scheduleRef, id));
                toast.success("Item excluído.");
            } catch (error: any) {
                toast.error("Erro ao excluir.", { description: error.message });
            }
        }
    };

    const handleSendAnnouncement = async () => {
        if (!newAnnouncement.trim()) return;
        setIsSending(true);
        try {
            await addDoc(announcementsRef, { message: newAnnouncement, createdAt: serverTimestamp() });
            setNewAnnouncement("");
            toast.success("Comunicado enviado!");
        } catch (error: any) {
            toast.error("Erro ao enviar comunicado.", { description: error.message });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Coluna do Cronograma */}
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle>Cronograma</CardTitle>
                    <Button size="sm" onClick={() => handleOpenScheduleDialog()}><PlusCircle className="mr-2 h-4 w-4"/>Adicionar</Button>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {scheduleItems.length > 0 ? scheduleItems.map(item => (
                            <div key={item.id} className="p-3 bg-muted/50 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold">{item.title}</p>
                                    <div className="flex gap-1">
                                        <Button variant="ghost" size="icon-sm" onClick={() => handleOpenScheduleDialog(item)}><Edit className="h-4 w-4"/></Button>
                                        <Button variant="ghost" size="icon-sm" onClick={() => handleDeleteScheduleItem(item.id)}><Trash className="h-4 w-4 text-destructive"/></Button>
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground flex items-center"><Calendar className="mr-2 h-3 w-3" />{format(item.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                                {item.location && <p className="text-sm text-muted-foreground flex items-center"><MapPin className="mr-2 h-3 w-3" />{item.location}</p>}
                                {item.notes && <p className="text-sm mt-2 pt-2 border-t">{item.notes}</p>}
                            </div>
                        )) : <p className="text-center text-muted-foreground py-8">Nenhum item no cronograma.</p>}
                    </div>
                </CardContent>
            </Card>

            {/* Coluna de Comunicados */}
            <Card>
                <CardHeader>
                    <CardTitle>Mural de Comunicados</CardTitle>
                    <CardDescription>Envie mensagens rápidas para os envolvidos no evento.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Textarea 
                            value={newAnnouncement}
                            onChange={e => setNewAnnouncement(e.target.value)}
                            placeholder="Escreva seu comunicado aqui..."
                        />
                        <Button onClick={handleSendAnnouncement} disabled={isSending || !newAnnouncement.trim()} className="w-full">
                            {isSending ? 'Enviando...' : 'Enviar Comunicado'}
                        </Button>
                    </div>
                    <div className="mt-6 space-y-4 max-h-60 overflow-y-auto pr-2">
                         {announcements.length > 0 ? announcements.map(item => (
                            <div key={item.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                                <p>{item.message}</p>
                                <p className="text-xs text-muted-foreground text-right mt-2">{format(item.createdAt.toDate(), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                           </div>
                         )) : <p className="text-center text-muted-foreground py-8">Nenhum comunicado enviado.</p>}
                    </div>
                </CardContent>
            </Card>

            {/* Dialog para Cronograma */}
            <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editingSchedule ? 'Editar Item' : 'Novo Item no Cronograma'}</DialogTitle></DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Input placeholder="Título (Ex: Ensaio Geral)" value={scheduleFormData.title} onChange={e => setScheduleFormData({...scheduleFormData, title: e.target.value})} />
                        <div className="grid grid-cols-2 gap-4">
                            <Input type="date" value={scheduleFormData.date} onChange={e => setScheduleFormData({...scheduleFormData, date: e.target.value})} />
                            <Input type="time" value={scheduleFormData.time} onChange={e => setScheduleFormData({...scheduleFormData, time: e.target.value})} />
                        </div>
                        <Input placeholder="Local (Opcional)" value={scheduleFormData.location} onChange={e => setScheduleFormData({...scheduleFormData, location: e.target.value})} />
                        <Textarea placeholder="Observações (Opcional)" value={scheduleFormData.notes} onChange={e => setScheduleFormData({...scheduleFormData, notes: e.target.value})} />
                    </div>
                    <DialogFooter>
                         <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>Cancelar</Button>
                         <Button onClick={handleSaveScheduleItem}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

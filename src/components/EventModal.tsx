
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';
import { EventInput } from '@fullcalendar/core';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (eventData: any) => Promise<void>;
    onDelete?: () => Promise<void>;
    event: Partial<EventInput> | null;
}

const eventTypes = [
    { value: 'rehearsal', label: 'Ensaio', color: '#22c55e' }, // green-500
    { value: 'holiday', label: 'Feriado', color: '#ef4444' }, // red-500
    { value: 'meeting', label: 'Reunião', color: '#3b82f6' }, // blue-500
    { value: 'performance', label: 'Apresentação', color: '#a855f7' }, // purple-500
    { value: 'other', label: 'Outro', color: '#737373' }, // neutral-500
];

export const EventModal = ({ isOpen, onClose, onSave, onDelete, event }: EventModalProps) => {
    const [title, setTitle] = useState('');
    const [allDay, setAllDay] = useState(false);
    const [start, setStart] = useState('');
    const [end, setEnd] = useState('');
    const [type, setType] = useState('other');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (event) {
            setTitle(event.title || '');
            setAllDay(event.allDay ?? false);
            setType(event.extendedProps?.type || 'other');
            
            // Formatação de data para os inputs type="datetime-local" ou type="date"
            const formatDateTime = (date: Date) => {
                const pad = (num: number) => num.toString().padStart(2, '0');
                if (allDay) {
                    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
                } else {
                    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
                }
            };

            if(event.start) setStart(formatDateTime(new Date(event.start as string)));
            if(event.end) setEnd(formatDateTime(new Date(event.end as string)));

        } else {
            // Resetar o formulário se não houver evento (modo de criação)
            setTitle('');
            setAllDay(false);
            setStart('');
            setEnd('');
            setType('other');
        }
    }, [event, allDay]);

    const handleSave = async () => {
        if (!title) {
            toast.warning('O título do evento é obrigatório.');
            return;
        }
        setIsSubmitting(true);
        const selectedType = eventTypes.find(t => t.value === type);
        const eventData = {
            title,
            start: new Date(start),
            end: end ? new Date(end) : null,
            allDay,
            extendedProps: {
                type: type,
            },
            // Propriedades visuais para o FullCalendar
            backgroundColor: selectedType?.color,
            borderColor: selectedType?.color,
        };
        await onSave(eventData);
        setIsSubmitting(false);
    };

    const handleDelete = async () => {
        if (onDelete) {
            setIsSubmitting(true);
            await onDelete();
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{event?.id ? 'Editar Evento' : 'Adicionar Novo Evento'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Título do Evento</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">Tipo de Evento</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger id="type">
                                <SelectValue placeholder="Selecione um tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                {eventTypes.map(t => (
                                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center space-x-2">
                         <Checkbox id="allDay" checked={allDay} onCheckedChange={(checked) => setAllDay(Boolean(checked))} />
                        <Label htmlFor="allDay">Dia inteiro?</Label>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="start">Início</Label>
                        <Input id="start" type={allDay ? 'date' : 'datetime-local'} value={start} onChange={(e) => setStart(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="end">Fim</Label>
                        <Input id="end" type={allDay ? 'date' : 'datetime-local'} value={end} onChange={(e) => setEnd(e.target.value)} disabled={allDay} />
                    </div>
                </div>
                <DialogFooter className="sm:justify-between">
                    <div>
                    {event?.id && onDelete && (
                        <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                           {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin"/> : <Trash2 className="h-4 w-4"/>}
                        </Button>
                    )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={onClose}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
                            Salvar
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

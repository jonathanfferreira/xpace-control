
import { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction'; // necessário para o dateClick
import listPlugin from '@fullcalendar/list';
import { EventInput } from '@fullcalendar/core';
import { db } from '@/integrations/firebase/client';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { EventModal } from '@/components/EventModal'; // Importando o Modal

// Estilos globais para o FullCalendar. É uma forma de garantir que o tema seja consistente.
const calendarStyles = `
  .fc {
    font-family: var(--font-sans);
  }
  .fc .fc-toolbar-title {
    font-size: 1.5rem;
    font-weight: 600;
  }
  .fc .fc-button {
    background-color: hsl(var(--primary));
    border-color: hsl(var(--primary));
  }
  .fc .fc-button:hover {
    background-color: hsl(var(--primary) / 0.9);
  }
  .fc .fc-daygrid-day.fc-day-today {
    background-color: hsl(var(--accent));
  }
  .fc-event {
    border: 1px solid #fff !important;
    cursor: pointer;
  }
`;

export default function Calendario() {
    const { schoolId } = useAuth();
    const [events, setEvents] = useState<EventInput[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<Partial<EventInput> | null>(null);

    const eventsCollectionRef = schoolId ? collection(db, `schools/${schoolId}/calendarEvents`) : null;

    useEffect(() => {
        if (!eventsCollectionRef) return;

        const unsub = onSnapshot(eventsCollectionRef,
            (snapshot) => {
                const fetchedEvents: EventInput[] = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        title: data.title,
                        start: data.start.toDate(),
                        end: data.end ? data.end.toDate() : null,
                        allDay: data.allDay || false,
                        extendedProps: data.extendedProps || {},
                        backgroundColor: data.backgroundColor,
                        borderColor: data.borderColor,
                    };
                });
                setEvents(fetchedEvents);
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching calendar events:", error);
                toast.error("Erro ao carregar eventos do calendário.");
                setLoading(false);
            }
        );

        return () => unsub(); // Limpa o listener ao desmontar
    }, [schoolId]);

    const handleDateClick = (arg: { date: Date; allDay: boolean }) => {
        setSelectedEvent({ start: arg.date, end: arg.date, allDay: arg.allDay });
        setIsModalOpen(true);
    };

    const handleEventClick = (arg: { event: EventInput }) => {
        setSelectedEvent(arg.event);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedEvent(null);
    };

    const handleSaveEvent = async (eventData: any) => {
        if (!eventsCollectionRef) return;

        // Convertendo datas para Timestamps do Firestore
        const processedData = {
            ...eventData,
            start: Timestamp.fromDate(new Date(eventData.start)),
            end: eventData.end ? Timestamp.fromDate(new Date(eventData.end)) : null,
        };

        try {
            if (selectedEvent?.id) {
                // Atualiza evento existente
                const eventDoc = doc(eventsCollectionRef, selectedEvent.id as string);
                await updateDoc(eventDoc, processedData);
                toast.success("Evento atualizado com sucesso!");
            } else {
                // Cria novo evento
                await addDoc(eventsCollectionRef, processedData);
                toast.success("Evento criado com sucesso!");
            }
            handleCloseModal();
        } catch (error) {
            console.error("Error saving event:", error);
            toast.error("Falha ao salvar o evento.");
        }
    };
    
    const handleDeleteEvent = async () => {
        if (!eventsCollectionRef || !selectedEvent?.id) return;
        try {
            const eventDoc = doc(eventsCollectionRef, selectedEvent.id as string);
            await deleteDoc(eventDoc);
            toast.success("Evento excluído com sucesso!");
            handleCloseModal();
        } catch (error) {
            console.error("Error deleting event:", error);
            toast.error("Falha ao excluir o evento.");
        }
    };


    return (
        <div className="space-y-6">
            <style>{calendarStyles}</style> 
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Calendário Escolar</h1>
                    <p className="text-muted-foreground">
                        Visualize e gerencie os eventos da sua escola.
                    </p>
                </div>
                <Button onClick={() => handleDateClick({ date: new Date(), allDay: true })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Adicionar Evento
                </Button>
            </div>
            <div className="p-4 bg-background rounded-lg shadow-sm border">
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,listWeek'
                    }}
                    events={events}
                    locale='pt-br'
                    buttonText={{
                        today: 'Hoje',
                        month: 'Mês',
                        week: 'Semana',
                        list: 'Lista'
                    }}
                    height="auto"
                    loading={loading}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                />
            </div>

            <EventModal 
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSave={handleSaveEvent}
                onDelete={selectedEvent?.id ? handleDeleteEvent : undefined}
                event={selectedEvent}
            />
        </div>
    );
}

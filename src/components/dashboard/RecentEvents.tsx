
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/integrations/firebase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CalendarEvent {
    id: string;
    title: string;
    start: Date;
    extendedProps: { type: string };
}

const eventTypeColors: { [key: string]: string } = {
    rehearsal: 'bg-green-500',
    holiday: 'bg-red-500',
    meeting: 'bg-blue-500',
    performance: 'bg-purple-500',
    other: 'bg-neutral-500',
};

export function RecentEvents() {
    const { schoolId } = useAuth();
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!schoolId) return;

        const now = new Date();
        const q = query(
            collection(db, `schools/${schoolId}/calendarEvents`),
            where('start', '>=', now),
            orderBy('start', 'asc'),
            limit(5)
        );

        const unsub = onSnapshot(q, (snapshot) => {
            const fetchedEvents = snapshot.docs.map(doc => ({
                id: doc.id,
                title: doc.data().title,
                start: doc.data().start.toDate(),
                extendedProps: doc.data().extendedProps || { type: 'other' },
            }));
            setEvents(fetchedEvents);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching recent events:", error);
            setLoading(false);
        });

        return () => unsub();
    }, [schoolId]);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        );
    }

    if (events.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-center">
                <CalendarIcon className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum evento futuro encontrado.</p>
                <p className="text-sm text-muted-foreground">Adicione eventos no Calendário.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {events.map((event) => (
                <div key={event.id} className="flex items-center">
                    <Avatar className="h-9 w-9">
                        <AvatarFallback className={`${eventTypeColors[event.extendedProps.type] || 'bg-neutral-500'} text-white`}>
                           <CalendarIcon size={20} />
                        </AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                            {format(event.start, "PPP 'às' HH:mm", { locale: ptBR })}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

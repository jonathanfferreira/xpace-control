import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/integrations/firebase/client";
import { useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Calendar, MapPin, Plus, Ticket, Users, Edit, Trash2, QrCode } from "lucide-react";
import { format } from "date-fns";
import { TicketQRDialog } from "@/components/events/TicketQRDialog";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, getDoc } from 'firebase/firestore';

interface Event {
    id: string;
    title: string;
    event_date: any;
    location?: string;
    description?: string;
    school_id: string;
}

interface TicketType {
    id: string;
    event_id: string;
    buyer_name: string;
    amount: number;
    student_id?: string;
    status: 'reserved' | 'paid';
    student_name?: string;
}

export default function Events() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [qrDialogTicketId, setQrDialogTicketId] = useState<string | null>(null);

  const [eventForm, setEventForm] = useState({ title: "", event_date: "", location: "", description: "" });
  const [ticketForm, setTicketForm] = useState({ buyer_name: "", amount: "", student_id: "" });

  useEffect(() => {
    if (!user) {
      navigate("/auth");
    } else {
      fetchEvents();
      fetchStudents();
    }
  }, [user, navigate]);

  const getSchoolId = async () => {
    if (!user) throw new Error("Usuário não autenticado");
    const schoolQuery = query(collection(db, 'schools'), where('admin_id', '==', user.uid));
    const schoolSnapshot = await getDocs(schoolQuery);
    if (schoolSnapshot.empty) throw new Error("Escola não encontrada");
    return schoolSnapshot.docs[0].id;
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const schoolId = await getSchoolId();
      const eventsQuery = query(collection(db, 'events'), where('school_id', '==', schoolId), orderBy("event_date", "desc"));
      const querySnapshot = await getDocs(eventsQuery);
      const eventsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Event[];
      setEvents(eventsData);
    } catch (error: any) {
      toast.error("Erro ao carregar eventos: " + error.message);
    } finally {
      setLoading(false);
    }
  };

    const fetchStudents = async () => {
        try {
            const schoolId = await getSchoolId();
            const studentsQuery = query(collection(db, 'students'), where('school_id', '==', schoolId), where('active', '==', true), orderBy('full_name'));
            const querySnapshot = await getDocs(studentsQuery);
            setStudents(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error) {
            console.error("Error fetching students:", error);
        }
    };


  const fetchTickets = async (eventId: string) => {
    try {
        const ticketsQuery = query(collection(db, 'tickets'), where("event_id", "==", eventId), orderBy("buyer_name"));
        const querySnapshot = await getDocs(ticketsQuery);
        const ticketsData = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
            const ticket = { id: docSnap.id, ...docSnap.data() } as TicketType;
            if (ticket.student_id) {
                const studentDoc = await getDoc(doc(db, 'students', ticket.student_id));
                if (studentDoc.exists()) {
                    ticket.student_name = studentDoc.data().full_name;
                }
            }
            return ticket;
        }));
        setTickets(ticketsData);
    } catch (error: any) {
        toast.error("Erro ao carregar ingressos: " + error.message);
    }
  };

  // ... rest of the functions converted to firebase ...

  // Dummy return for now
  return <DashboardLayout><div>Events</div></DashboardLayout>;
}

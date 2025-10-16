import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
import type { Database } from "@/integrations/supabase/types";

type Event = Database["public"]["Tables"]["events"]["Row"];
type TicketType = Database["public"]["Tables"]["tickets"]["Row"] & {
  students?: { full_name: string } | null;
};

export default function Events() {
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

  const [eventForm, setEventForm] = useState({
    title: "",
    event_date: "",
    location: "",
    description: "",
  });

  const [ticketForm, setTicketForm] = useState({
    buyer_name: "",
    amount: "",
    student_id: "",
  });

  useEffect(() => {
    checkAuth();
    fetchEvents();
    fetchStudents();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: false });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar eventos");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await supabase
        .from("students")
        .select("id, full_name")
        .eq("active", true)
        .order("full_name");

      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const fetchTickets = async (eventId: string) => {
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          students(full_name)
        `)
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar ingressos");
    }
  };

  const handleCreateEvent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: schoolData } = await supabase
        .from("schools")
        .select("id")
        .eq("admin_id", user.id)
        .single();

      if (!schoolData) {
        toast.error("Escola não encontrada");
        return;
      }

      if (editingEvent) {
        const { error } = await supabase
          .from("events")
          .update(eventForm)
          .eq("id", editingEvent.id);

        if (error) throw error;
        toast.success("Evento atualizado!");
      } else {
        const { error } = await supabase
          .from("events")
          .insert({
            ...eventForm,
            school_id: schoolData.id,
          });

        if (error) throw error;
        toast.success("Evento criado!");
      }

      setIsEventDialogOpen(false);
      resetEventForm();
      fetchEvents();
    } catch (error: any) {
      toast.error("Erro ao salvar evento: " + error.message);
    }
  };

  const handleCreateTicket = async () => {
    if (!selectedEvent) return;

    try {
      const { error } = await supabase
        .from("tickets")
        .insert({
          event_id: selectedEvent,
          buyer_name: ticketForm.buyer_name,
          amount: parseFloat(ticketForm.amount),
          student_id: ticketForm.student_id || null,
          status: "reserved",
        });

      if (error) throw error;

      toast.success("Ingresso reservado!");
      setIsTicketDialogOpen(false);
      resetTicketForm();
      fetchTickets(selectedEvent);
    } catch (error: any) {
      toast.error("Erro ao criar ingresso: " + error.message);
    }
  };

  const handleMarkTicketAsPaid = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from("tickets")
        .update({ status: "paid" })
        .eq("id", ticketId);

      if (error) throw error;

      toast.success("Ingresso marcado como pago!");
      if (selectedEvent) fetchTickets(selectedEvent);
    } catch (error: any) {
      toast.error("Erro ao atualizar ingresso");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Tem certeza que deseja excluir este evento?")) return;

    try {
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) throw error;

      toast.success("Evento excluído!");
      fetchEvents();
    } catch (error: any) {
      toast.error("Erro ao excluir evento");
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      event_date: event.event_date.split("T")[0],
      location: event.location || "",
      description: event.description || "",
    });
    setIsEventDialogOpen(true);
  };

  const resetEventForm = () => {
    setEventForm({
      title: "",
      event_date: "",
      location: "",
      description: "",
    });
    setEditingEvent(null);
  };

  const resetTicketForm = () => {
    setTicketForm({
      buyer_name: "",
      amount: "",
      student_id: "",
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === "paid") {
      return <Badge className="bg-green-500">Pago</Badge>;
    }
    return <Badge variant="secondary">Reservado</Badge>;
  };

  const handleViewEvent = (eventId: string) => {
    setSelectedEvent(eventId);
    fetchTickets(eventId);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Eventos & Espetáculos</h1>
            <p className="text-muted-foreground">Gerencie eventos e ingressos</p>
          </div>

          <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-xpace" onClick={resetEventForm}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingEvent ? "Editar Evento" : "Criar Evento"}
                </DialogTitle>
                <DialogDescription>
                  Preencha as informações do evento
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Título do Evento</Label>
                  <Input
                    value={eventForm.title}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, title: e.target.value })
                    }
                    placeholder="Ex: Espetáculo de Fim de Ano"
                  />
                </div>

                <div>
                  <Label>Data e Hora</Label>
                  <Input
                    type="datetime-local"
                    value={eventForm.event_date}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, event_date: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label>Local</Label>
                  <Input
                    value={eventForm.location}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, location: e.target.value })
                    }
                    placeholder="Teatro Municipal"
                  />
                </div>

                <div>
                  <Label>Descrição</Label>
                  <Textarea
                    value={eventForm.description}
                    onChange={(e) =>
                      setEventForm({ ...eventForm, description: e.target.value })
                    }
                    placeholder="Descrição do evento..."
                    rows={4}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEventDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateEvent} className="gradient-xpace">
                  {editingEvent ? "Salvar" : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList>
            <TabsTrigger value="events">Eventos</TabsTrigger>
            <TabsTrigger value="tickets" disabled={!selectedEvent}>
              Ingressos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-4">
            {events.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum evento criado ainda
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {events.map((event) => (
                  <Card
                    key={event.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => handleViewEvent(event.id)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between">
                        <span className="flex-1">{event.title}</span>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(event);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteEvent(event.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(event.event_date), "dd/MM/yyyy HH:mm")}
                        </div>
                        {event.location && (
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                        )}
                      </CardDescription>
                    </CardHeader>
                    {event.description && (
                      <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {event.description}
                        </p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="tickets" className="space-y-4">
            {selectedEvent && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">Ingressos</h2>
                    <p className="text-sm text-muted-foreground">
                      {events.find((e) => e.id === selectedEvent)?.title}
                    </p>
                  </div>

                  <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gradient-xpace">
                        <Ticket className="h-4 w-4 mr-2" />
                        Novo Ingresso
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Reservar Ingresso</DialogTitle>
                        <DialogDescription>
                          Preencha os dados do ingresso
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4">
                        <div>
                          <Label>Nome do Comprador</Label>
                          <Input
                            value={ticketForm.buyer_name}
                            onChange={(e) =>
                              setTicketForm({ ...ticketForm, buyer_name: e.target.value })
                            }
                            placeholder="Nome completo"
                          />
                        </div>

                        <div>
                          <Label>Aluno (opcional)</Label>
                          <select
                            className="w-full p-2 border rounded"
                            value={ticketForm.student_id}
                            onChange={(e) =>
                              setTicketForm({ ...ticketForm, student_id: e.target.value })
                            }
                          >
                            <option value="">Nenhum aluno vinculado</option>
                            {students.map((student) => (
                              <option key={student.id} value={student.id}>
                                {student.full_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <Label>Valor (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={ticketForm.amount}
                            onChange={(e) =>
                              setTicketForm({ ...ticketForm, amount: e.target.value })
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => setIsTicketDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleCreateTicket} className="gradient-xpace">
                          Reservar
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                <Card>
                  <CardContent className="pt-6">
                    {tickets.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum ingresso vendido ainda
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {tickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex-1">
                              <p className="font-medium">{ticket.buyer_name}</p>
                              {ticket.students && (
                                <p className="text-sm text-muted-foreground">
                                  Aluno: {ticket.students.full_name}
                                </p>
                              )}
                              <p className="text-sm text-muted-foreground">
                                R$ {Number(ticket.amount).toFixed(2)}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              {getStatusBadge(ticket.status || "reserved")}
                              {ticket.status === "reserved" && (
                                <Button
                                  onClick={() => handleMarkTicketAsPaid(ticket.id)}
                                  size="sm"
                                  variant="outline"
                                >
                                  Marcar como Pago
                                </Button>
                              )}
                              <Button
                                size="icon"
                                variant="ghost"
                                title="Ver QR Code"
                                onClick={() => setQrDialogTicketId(ticket.id)}
                              >
                                <QrCode className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>

        {qrDialogTicketId && (
          <TicketQRDialog
            ticketId={qrDialogTicketId}
            open={!!qrDialogTicketId}
            onOpenChange={(open) => !open && setQrDialogTicketId(null)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

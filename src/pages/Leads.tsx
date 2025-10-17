import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors, DragOverlay, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Mail, Phone, MapPin, Calendar, Send, Filter, X, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type LeadStatus = 'new' | 'contacted' | 'converted' | 'discarded';
type LeadSource = 'website' | 'referral' | 'social' | 'ads' | 'other';

interface Lead {
  id: string;
  school_name: string;
  city: string;
  email: string;
  whatsapp: string;
  notes: string | null;
  status: LeadStatus;
  source?: LeadSource;
  created_at: string;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: 'Novo', color: 'bg-blue-500' },
  contacted: { label: 'Contato', color: 'bg-yellow-500' },
  converted: { label: 'Convertido', color: 'bg-green-500' },
  discarded: { label: 'Descartado', color: 'bg-gray-500' },
};

function SortableLeadCard({ lead, status, onSendEmail, onSendWhatsApp }: { 
  lead: Lead; 
  status: LeadStatus;
  onSendEmail: (leadId: string, email: string) => void;
  onSendWhatsApp: (leadId: string, whatsapp: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: lead.id,
    data: { lead, currentStatus: status }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="cursor-move hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{lead.school_name}</CardTitle>
          <CardDescription className="text-xs">
            {format(new Date(lead.created_at), "dd 'de' MMMM", { locale: ptBR })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="text-xs">{lead.city}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span className="text-xs truncate">{lead.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span className="text-xs">{lead.whatsapp}</span>
          </div>
          {lead.notes && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
              {lead.notes}
            </p>
          )}
          {status === 'new' && (
            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onSendEmail(lead.id, lead.email);
                }}
              >
                <Send className="h-3 w-3 mr-1" />
                Email
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onSendWhatsApp(lead.id, lead.whatsapp);
                }}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                WhatsApp
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function Leads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<LeadSource | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchLeads();
  }, [user]);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLeads((data || []) as Lead[]);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar leads',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const leadId = active.id as string;
    const activeData = active.data.current;
    const overData = over.data.current;
    
    // Determine new status from drop zone
    const newStatus = overData?.status || (over.id as LeadStatus);

    try {
      const { error } = await supabase
        .from('leads')
        .update({ status: newStatus })
        .eq('id', leadId);

      if (error) throw error;

      setLeads(leads.map(lead => 
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      ));

      toast({
        title: 'Status atualizado',
        description: `Lead movido para ${STATUS_CONFIG[newStatus].label}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const sendWelcomeEmail = async (leadId: string, email: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-welcome-email', {
        body: { leadId, email },
      });

      if (error) throw error;

      toast({
        title: 'Email enviado',
        description: 'Email de boas-vindas enviado com sucesso!',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar email',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const sendWhatsAppMessage = async (leadId: string, whatsapp: string) => {
    try {
      const { error } = await supabase.functions.invoke('send-whatsapp', {
        body: { 
          phone: whatsapp,
          message: `Olá! Obrigado pelo interesse no XPACE Control. Estamos prontos para ajudar sua escola de dança!`,
          type: 'lead'
        },
      });

      if (error) throw error;

      toast({
        title: 'WhatsApp enviado',
        description: 'Mensagem enviada com sucesso!',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar WhatsApp',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads
      .filter(lead => lead.status === status)
      .filter(lead => filterSource === 'all' || lead.source === filterSource)
      .filter(lead => 
        searchTerm === '' || 
        lead.school_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
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

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">CRM / Leads</h1>
          <p className="text-muted-foreground">Gerencie seus leads e oportunidades</p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Buscar por nome, cidade ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
          <Select value={filterSource} onValueChange={(v) => setFilterSource(v as any)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrar origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as origens</SelectItem>
              <SelectItem value="website">Website</SelectItem>
              <SelectItem value="referral">Indicação</SelectItem>
              <SelectItem value="social">Redes Sociais</SelectItem>
              <SelectItem value="ads">Anúncios</SelectItem>
              <SelectItem value="other">Outros</SelectItem>
            </SelectContent>
          </Select>
          {(searchTerm || filterSource !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setFilterSource('all');
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        <DndContext 
          sensors={sensors} 
          onDragEnd={handleDragEnd}
          onDragStart={(event) => setActiveId(event.active.id as string)}
          collisionDetection={closestCenter}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((status) => {
              const statusLeads = getLeadsByStatus(status);
              return (
                <div 
                  key={status} 
                  className="space-y-4"
                  data-status={status}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${STATUS_CONFIG[status].color}`} />
                    <h3 className="font-semibold">
                      {STATUS_CONFIG[status].label}
                    </h3>
                    <Badge variant="secondary" className="ml-auto">
                      {statusLeads.length}
                    </Badge>
                  </div>

                  <SortableContext 
                    items={statusLeads.map(l => l.id)}
                    strategy={verticalListSortingStrategy}
                    id={status}
                  >
                    <div 
                      className="space-y-3 min-h-[200px] p-2 rounded-lg border-2 border-dashed border-transparent transition-colors"
                      data-droppable
                      data-status={status}
                    >
                      {statusLeads.map((lead) => (
                        <SortableLeadCard
                          key={lead.id}
                          lead={lead}
                          status={status}
                          onSendEmail={sendWelcomeEmail}
                          onSendWhatsApp={sendWhatsAppMessage}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </div>
              );
            })}
          </div>

          <DragOverlay>
            {activeLead ? (
              <Card className="cursor-move shadow-2xl opacity-90">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{activeLead.school_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="text-xs">{activeLead.city}</span>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </DashboardLayout>
  );
}

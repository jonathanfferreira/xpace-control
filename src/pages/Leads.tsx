import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Mail, Phone, MapPin, Calendar, Send } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type LeadStatus = 'new' | 'contacted' | 'converted' | 'discarded';

interface Lead {
  id: string;
  school_name: string;
  city: string;
  email: string;
  whatsapp: string;
  notes: string | null;
  status: LeadStatus;
  created_at: string;
}

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  new: { label: 'Novo', color: 'bg-blue-500' },
  contacted: { label: 'Contato', color: 'bg-yellow-500' },
  converted: { label: 'Convertido', color: 'bg-green-500' },
  discarded: { label: 'Descartado', color: 'bg-gray-500' },
};

export default function Leads() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

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

    if (!over || active.id === over.id) return;

    const leadId = active.id as string;
    const newStatus = over.id as LeadStatus;

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

  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter(lead => lead.status === status);
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
        <div>
          <h1 className="text-3xl font-bold text-foreground">CRM / Leads</h1>
          <p className="text-muted-foreground">Gerencie seus leads e oportunidades</p>
        </div>

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(Object.keys(STATUS_CONFIG) as LeadStatus[]).map((status) => (
              <div key={status} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${STATUS_CONFIG[status].color}`} />
                  <h3 className="font-semibold">
                    {STATUS_CONFIG[status].label}
                  </h3>
                  <Badge variant="secondary" className="ml-auto">
                    {getLeadsByStatus(status).length}
                  </Badge>
                </div>

                <div className="space-y-3 min-h-[200px]">
                  {getLeadsByStatus(status).map((lead) => (
                    <Card
                      key={lead.id}
                      className="cursor-move hover:shadow-md transition-shadow"
                      draggable
                    >
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
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full mt-2"
                            onClick={() => sendWelcomeEmail(lead.id, lead.email)}
                          >
                            <Send className="h-3 w-3 mr-1" />
                            Enviar Email
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </DndContext>
      </div>
    </DashboardLayout>
  );
}
